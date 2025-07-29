-- Criar todas as funções necessárias que estão faltando

-- 1. Função básica para registrar pesquisas (compatível com chamadas existentes)
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
    -- Log da execução
    RAISE NOTICE '[LOG_SEARCH_SAFE] Iniciando registro para: % (source: %, cached: %)', 
        substance_name, response_source, was_cached;
    
    -- Verificar se as colunas existem
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_history' AND column_name = 'response_source'
    ) INTO has_response_source_column;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_history' AND column_name = 'api_response_cached'
    ) INTO has_cached_column;
    
    RAISE NOTICE '[LOG_SEARCH_SAFE] Colunas disponíveis - response_source: %, cached: %', 
        has_response_source_column, has_cached_column;
    
    -- Buscar ou criar a substância
    SELECT * INTO substance_record 
    FROM substances 
    WHERE LOWER(name) = LOWER(substance_name);
    
    -- Se não existir, criar
    IF substance_record IS NULL THEN
        INSERT INTO substances (name, dcb_name) 
        VALUES (LOWER(substance_name), substance_name) 
        RETURNING * INTO substance_record;
        
        RAISE NOTICE '[LOG_SEARCH_SAFE] Nova substância criada: % (ID: %)', 
            substance_name, substance_record.id;
    ELSE
        RAISE NOTICE '[LOG_SEARCH_SAFE] Substância encontrada: % (ID: %)', 
            substance_name, substance_record.id;
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
        
        RAISE NOTICE '[LOG_SEARCH_SAFE] Pesquisa registrada (completa): %', search_id;
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
        
        RAISE NOTICE '[LOG_SEARCH_SAFE] Pesquisa registrada (básica): %', search_id;
    END IF;
    
    RETURN search_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[LOG_SEARCH_SAFE] ERRO: %', SQLERRM;
        -- Retornar um UUID mesmo com erro para não quebrar a aplicação
        RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;

-- 2. Função para salvar dados de degradação
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
    RAISE NOTICE '[SAVE_DATA_SAFE] Salvando dados para: % (source: %, time: %ms)', 
        substance_name, response_source, processing_time_ms;
    
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
    
    RAISE NOTICE '[SAVE_DATA_SAFE] Substância processada: % (ID: %)', 
        substance_name, substance_record.id;
    
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
        
        RAISE NOTICE '[SAVE_DATA_SAFE] Resposta API salva: %', api_response_id;
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
        
        RAISE NOTICE '[SAVE_DATA_SAFE] % produtos de degradação salvos', 
            json_array_length(products);
    END IF;
    
    -- Inserir referências se fornecidas
    IF references_list IS NOT NULL AND json_typeof(references_list) = 'array' THEN
        FOR reference_item IN SELECT value::text FROM json_array_elements_text(references_list)
        LOOP
            INSERT INTO "references" (substance_id, reference_text, reference_order)
            VALUES (substance_record.id, reference_item, reference_order);
            reference_order := reference_order + 1;
        END LOOP;
        
        RAISE NOTICE '[SAVE_DATA_SAFE] % referências salvas', 
            json_array_length(references_list);
    END IF;
    
    RETURN substance_record.id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[SAVE_DATA_SAFE] ERRO: %', SQLERRM;
        -- Retornar um UUID mesmo com erro
        RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;

-- 3. Função para buscar dados existentes
CREATE OR REPLACE FUNCTION get_substance_data(substance_name TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
    substance_record RECORD;
BEGIN
    RAISE NOTICE '[GET_SUBSTANCE_DATA] Buscando dados para: %', substance_name;
    
    -- Buscar a substância (case-insensitive)
    SELECT * INTO substance_record 
    FROM substances 
    WHERE LOWER(name) = LOWER(substance_name) 
    OR LOWER(dcb_name) = LOWER(substance_name);
    
    -- Se não encontrar, retornar null
    IF substance_record IS NULL THEN
        RAISE NOTICE '[GET_SUBSTANCE_DATA] Substância não encontrada: %', substance_name;
        RETURN NULL;
    END IF;
    
    RAISE NOTICE '[GET_SUBSTANCE_DATA] Substância encontrada: % (ID: %)', 
        substance_name, substance_record.id;
    
    -- Construir o JSON com todos os dados
    SELECT json_build_object(
        'substance', json_build_object(
            'id', substance_record.id,
            'name', substance_record.name,
            'cas_number', substance_record.cas_number,
            'dcb_name', substance_record.dcb_name
        ),
        'products', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'substance', product_name,
                    'degradationRoute', degradation_route,
                    'environmentalConditions', environmental_conditions,
                    'toxicityData', toxicity_data
                )
            )
            FROM degradation_products 
            WHERE substance_id = substance_record.id
        ), '[]'::json),
        'references', COALESCE((
            SELECT json_agg(reference_text ORDER BY reference_order)
            FROM "references" 
            WHERE substance_id = substance_record.id
        ), '[]'::json)
    ) INTO result;
    
    RAISE NOTICE '[GET_SUBSTANCE_DATA] Dados retornados com % produtos e % referências', 
        json_array_length(result->'products'), 
        json_array_length(result->'references');
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[GET_SUBSTANCE_DATA] ERRO: %', SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;
