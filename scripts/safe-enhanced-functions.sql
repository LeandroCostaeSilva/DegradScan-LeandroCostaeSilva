-- Função segura para registrar pesquisas (com verificação de colunas)
CREATE OR REPLACE FUNCTION log_search_safe(
    substance_name TEXT,
    search_term TEXT DEFAULT NULL,
    user_ip TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    response_source TEXT DEFAULT 'unknown',
    was_cached BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    substance_record RECORD;
    search_id UUID;
    has_response_source_column BOOLEAN;
    has_cached_column BOOLEAN;
BEGIN
    -- Verificar se as colunas existem
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_history' AND column_name = 'response_source'
    ) INTO has_response_source_column;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_history' AND column_name = 'api_response_cached'
    ) INTO has_cached_column;
    
    -- Buscar ou criar a substância
    SELECT * INTO substance_record 
    FROM substances 
    WHERE LOWER(name) = LOWER(substance_name);
    
    -- Se não existir, criar
    IF substance_record IS NULL THEN
        INSERT INTO substances (name, dcb_name) 
        VALUES (LOWER(substance_name), substance_name) 
        RETURNING * INTO substance_record;
    END IF;
    
    -- Registrar a pesquisa com base nas colunas disponíveis
    IF has_response_source_column AND has_cached_column THEN
        -- Versão completa com todas as colunas
        INSERT INTO search_history (
            substance_id, 
            search_term, 
            user_ip, 
            user_agent, 
            api_response_cached, 
            response_source
        )
        VALUES (
            substance_record.id, 
            COALESCE(search_term, substance_name), 
            user_ip, 
            user_agent, 
            was_cached, 
            response_source
        )
        RETURNING id INTO search_id;
    ELSE
        -- Versão básica apenas com colunas essenciais
        INSERT INTO search_history (
            substance_id, 
            search_term, 
            user_ip, 
            user_agent
        )
        VALUES (
            substance_record.id, 
            COALESCE(search_term, substance_name), 
            user_ip, 
            user_agent
        )
        RETURNING id INTO search_id;
    END IF;
    
    RETURN search_id;
END;
$$ LANGUAGE plpgsql;

-- Função segura para salvar dados de degradação
CREATE OR REPLACE FUNCTION save_degradation_data_safe(
    substance_name TEXT,
    search_term TEXT,
    cas_number TEXT DEFAULT NULL,
    dcb_name TEXT DEFAULT NULL,
    products JSON DEFAULT NULL,
    references_list JSON DEFAULT NULL,
    response_source TEXT DEFAULT 'unknown',
    processing_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    substance_record RECORD;
    product_item JSON;
    reference_item TEXT;
    reference_order INT := 1;
    api_response_id UUID;
    has_api_responses_table BOOLEAN;
BEGIN
    -- Verificar se a tabela api_responses existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'api_responses'
    ) INTO has_api_responses_table;
    
    -- Inserir ou atualizar substância
    INSERT INTO substances (name, cas_number, dcb_name)
    VALUES (LOWER(substance_name), cas_number, dcb_name)
    ON CONFLICT (name) DO UPDATE SET
        cas_number = COALESCE(EXCLUDED.cas_number, substances.cas_number),
        dcb_name = COALESCE(EXCLUDED.dcb_name, substances.dcb_name),
        updated_at = NOW()
    RETURNING * INTO substance_record;
    
    -- Salvar resposta completa da API para auditoria (se tabela existir)
    IF has_api_responses_table THEN
        INSERT INTO api_responses (
            substance_id, 
            search_term, 
            response_data, 
            response_source, 
            processing_time_ms
        ) VALUES (
            substance_record.id,
            search_term,
            json_build_object(
                'products', COALESCE(products, '[]'::json),
                'references', COALESCE(references_list, '[]'::json)
            ),
            response_source,
            processing_time_ms
        ) RETURNING id INTO api_response_id;
    END IF;
    
    -- Limpar dados existentes para atualização
    DELETE FROM degradation_products WHERE substance_id = substance_record.id;
    DELETE FROM "references" WHERE substance_id = substance_record.id;
    
    -- Inserir produtos de degradação se fornecidos
    IF products IS NOT NULL AND json_typeof(products) = 'array' THEN
        FOR product_item IN SELECT * FROM json_array_elements(products)
        LOOP
            INSERT INTO degradation_products (
                substance_id, 
                product_name, 
                degradation_route, 
                environmental_conditions, 
                toxicity_data
            ) VALUES (
                substance_record.id,
                COALESCE(product_item->>'substance', 'Não especificado'),
                COALESCE(product_item->>'degradationRoute', 'Não especificado'),
                COALESCE(product_item->>'environmentalConditions', 'Não especificado'),
                COALESCE(product_item->>'toxicityData', 'Não especificado')
            );
        END LOOP;
    END IF;
    
    -- Inserir referências se fornecidas
    IF references_list IS NOT NULL AND json_typeof(references_list) = 'array' THEN
        FOR reference_item IN SELECT value::text FROM json_array_elements_text(references_list)
        LOOP
            INSERT INTO "references" (substance_id, reference_text, reference_order)
            VALUES (substance_record.id, reference_item, reference_order);
            reference_order := reference_order + 1;
        END LOOP;
    END IF;
    
    RETURN substance_record.id;
END;
$$ LANGUAGE plpgsql;

-- View segura para estatísticas (com verificação de colunas)
CREATE OR REPLACE VIEW search_statistics_safe AS
SELECT 
    s.name as substance_name,
    s.dcb_name,
    s.cas_number,
    COUNT(sh.id) as total_searches,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'search_history' AND column_name = 'api_response_cached'
        ) THEN COUNT(CASE WHEN sh.api_response_cached = false THEN 1 END)
        ELSE 0
    END as new_api_calls,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'search_history' AND column_name = 'api_response_cached'
        ) THEN COUNT(CASE WHEN sh.api_response_cached = true THEN 1 END)
        ELSE 0
    END as cached_responses,
    MAX(sh.search_timestamp) as last_searched,
    COUNT(DISTINCT sh.user_ip) as unique_users,
    s.created_at as first_added,
    s.updated_at as last_updated
FROM substances s
LEFT JOIN search_history sh ON s.id = sh.substance_id
GROUP BY s.id, s.name, s.dcb_name, s.cas_number, s.created_at, s.updated_at
ORDER BY total_searches DESC;
