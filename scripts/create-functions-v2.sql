-- Função corrigida para salvar dados de degradação completos
CREATE OR REPLACE FUNCTION save_degradation_data(
    substance_name TEXT,
    cas_number TEXT DEFAULT NULL,
    dcb_name TEXT DEFAULT NULL,
    products JSON DEFAULT NULL,
    references_list JSON DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    substance_record RECORD;
    product_item JSON;
    reference_item TEXT;
    reference_order INT := 1;
BEGIN
    -- Inserir ou atualizar substância
    INSERT INTO substances (name, cas_number, dcb_name)
    VALUES (LOWER(substance_name), cas_number, dcb_name)
    ON CONFLICT (name) DO UPDATE SET
        cas_number = COALESCE(EXCLUDED.cas_number, substances.cas_number),
        dcb_name = COALESCE(EXCLUDED.dcb_name, substances.dcb_name),
        updated_at = NOW()
    RETURNING * INTO substance_record;
    
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

-- Função corrigida para buscar dados completos de uma substância
CREATE OR REPLACE FUNCTION get_substance_data(substance_name TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
    substance_record RECORD;
BEGIN
    -- Buscar a substância (case-insensitive)
    SELECT * INTO substance_record 
    FROM substances 
    WHERE LOWER(name) = LOWER(substance_name) 
    OR LOWER(dcb_name) = LOWER(substance_name);
    
    -- Se não encontrar, retornar null
    IF substance_record IS NULL THEN
        RETURN NULL;
    END IF;
    
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
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar uma pesquisa no histórico (sem alterações)
CREATE OR REPLACE FUNCTION log_search(
    substance_name TEXT,
    search_term TEXT DEFAULT NULL,
    user_ip TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    substance_record RECORD;
    search_id UUID;
BEGIN
    -- Buscar ou criar a substância
    SELECT * INTO substance_record 
    FROM substances 
    WHERE LOWER(name) = LOWER(substance_name);
    
    -- Se não existir, criar
    IF substance_record IS NULL THEN
        INSERT INTO substances (name) 
        VALUES (LOWER(substance_name)) 
        RETURNING * INTO substance_record;
    END IF;
    
    -- Registrar a pesquisa
    INSERT INTO search_history (substance_id, search_term, user_ip, user_agent)
    VALUES (substance_record.id, COALESCE(search_term, substance_name), user_ip, user_agent)
    RETURNING id INTO search_id;
    
    RETURN search_id;
END;
$$ LANGUAGE plpgsql;
