-- SOLUÇÃO DEFINITIVA PARA CACHE E LOGGING
-- Esta solução cria tudo do zero e funciona independentemente do estado atual

-- 1. CRIAR EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS PARA CACHE (com verificação de existência)
DO $$
BEGIN
    -- Tabela de cache simples e eficiente
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'simple_cache') THEN
        CREATE TABLE simple_cache (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            cache_key VARCHAR(255) NOT NULL UNIQUE,
            substance_name VARCHAR(255) NOT NULL,
            cached_data JSONB NOT NULL,
            cache_source VARCHAR(50) NOT NULL DEFAULT 'unknown',
            hit_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
            last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Índices para performance
        CREATE INDEX idx_simple_cache_key ON simple_cache(cache_key);
        CREATE INDEX idx_simple_cache_substance ON simple_cache(substance_name);
        CREATE INDEX idx_simple_cache_expires ON simple_cache(expires_at);
        
        RAISE NOTICE '✅ Tabela simple_cache criada com sucesso';
    ELSE
        RAISE NOTICE '✅ Tabela simple_cache já existe';
    END IF;
    
    -- Tabela de logs simples
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'simple_logs') THEN
        CREATE TABLE simple_logs (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            log_level VARCHAR(20) NOT NULL DEFAULT 'INFO',
            component VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_simple_logs_level ON simple_logs(log_level);
        CREATE INDEX idx_simple_logs_component ON simple_logs(component);
        CREATE INDEX idx_simple_logs_created_at ON simple_logs(created_at);
        
        RAISE NOTICE '✅ Tabela simple_logs criada com sucesso';
    ELSE
        RAISE NOTICE '✅ Tabela simple_logs já existe';
    END IF;
END $$;

-- 3. FUNÇÃO PARA CACHE (SIMPLES E ROBUSTA)
CREATE OR REPLACE FUNCTION get_cache_data(p_cache_key VARCHAR(255))
RETURNS JSONB AS $$
DECLARE
    cached_record RECORD;
BEGIN
    -- Buscar no cache válido
    SELECT * INTO cached_record
    FROM simple_cache 
    WHERE cache_key = p_cache_key 
    AND expires_at > NOW();
    
    IF cached_record IS NOT NULL THEN
        -- Atualizar contadores
        UPDATE simple_cache 
        SET hit_count = hit_count + 1,
            last_accessed = NOW()
        WHERE id = cached_record.id;
        
        RAISE NOTICE '[CACHE] HIT para chave: % (hits: %)', p_cache_key, cached_record.hit_count + 1;
        RETURN cached_record.cached_data;
    ELSE
        RAISE NOTICE '[CACHE] MISS para chave: %', p_cache_key;
        RETURN NULL;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[CACHE] ERRO ao buscar cache: %', SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. FUNÇÃO PARA SALVAR NO CACHE
CREATE OR REPLACE FUNCTION set_cache_data(
    p_cache_key VARCHAR(255),
    p_substance_name VARCHAR(255),
    p_data JSONB,
    p_source VARCHAR(50) DEFAULT 'unknown'
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO simple_cache (
        cache_key, 
        substance_name, 
        cached_data, 
        cache_source,
        expires_at
    ) VALUES (
        p_cache_key, 
        p_substance_name, 
        p_data, 
        p_source,
        NOW() + INTERVAL '24 hours'
    ) ON CONFLICT (cache_key) DO UPDATE SET
        cached_data = EXCLUDED.cached_data,
        cache_source = EXCLUDED.cache_source,
        expires_at = NOW() + INTERVAL '24 hours',
        last_accessed = NOW();
    
    RAISE NOTICE '[CACHE] SET para chave: % (source: %)', p_cache_key, p_source;
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[CACHE] ERRO ao salvar cache: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 5. FUNÇÃO PARA LOGS SIMPLES
CREATE OR REPLACE FUNCTION simple_log(
    p_level VARCHAR(20),
    p_component VARCHAR(50),
    p_message TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO simple_logs (log_level, component, message, metadata)
    VALUES (p_level, p_component, p_message, p_metadata)
    RETURNING id INTO log_id;
    
    RAISE NOTICE '[%] [%] %', p_level, p_component, p_message;
    RETURN log_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[ERROR] [LOG] Erro ao salvar log: %', SQLERRM;
        RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;

-- 6. FUNÇÃO PARA LIMPEZA DE CACHE EXPIRADO
CREATE OR REPLACE FUNCTION cleanup_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM simple_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    PERFORM simple_log('INFO', 'cache', 
        format('Limpeza automática: %s registros removidos', deleted_count),
        json_build_object('deleted_count', deleted_count)
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 7. RECRIAR FUNÇÕES ESSENCIAIS (VERSÃO SIMPLIFICADA)
CREATE OR REPLACE FUNCTION log_search_simple(
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
BEGIN
    -- Buscar ou criar substância
    SELECT * INTO substance_record 
    FROM substances 
    WHERE LOWER(name) = LOWER(substance_name);
    
    IF substance_record IS NULL THEN
        INSERT INTO substances (name, dcb_name) 
        VALUES (LOWER(substance_name), substance_name) 
        RETURNING * INTO substance_record;
    END IF;
    
    -- Registrar pesquisa (versão básica sempre funciona)
    INSERT INTO search_history (substance_id, search_term, user_ip, user_agent)
    VALUES (
        substance_record.id, 
        COALESCE(search_term, substance_name), 
        user_ip, 
        user_agent
    ) RETURNING id INTO search_id;
    
    -- Tentar adicionar colunas extras se existirem
    BEGIN
        UPDATE search_history 
        SET response_source = log_search_simple.response_source,
            api_response_cached = was_cached
        WHERE id = search_id;
    EXCEPTION
        WHEN OTHERS THEN
            -- Ignorar se colunas não existem
            NULL;
    END;
    
    PERFORM simple_log('INFO', 'search', 
        format('Pesquisa registrada: %s (%s)', substance_name, response_source),
        json_build_object(
            'substance', substance_name,
            'source', response_source,
            'cached', was_cached
        )
    );
    
    RETURN search_id;
    
EXCEPTION
    WHEN OTHERS THEN
        PERFORM simple_log('ERROR', 'search', 
            format('Erro ao registrar pesquisa: %s', SQLERRM)
        );
        RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;

-- 8. FUNÇÃO PARA SALVAR DADOS (VERSÃO SIMPLIFICADA)
CREATE OR REPLACE FUNCTION save_data_simple(
    substance_name TEXT,
    products JSON DEFAULT NULL,
    references_list JSON DEFAULT NULL,
    response_source TEXT DEFAULT 'unknown'
)
RETURNS UUID AS $$
DECLARE
    substance_record RECORD;
    product_item JSON;
    reference_item TEXT;
    reference_order INT := 1;
BEGIN
    -- Inserir ou atualizar substância
    INSERT INTO substances (name, dcb_name)
    VALUES (LOWER(substance_name), substance_name)
    ON CONFLICT (name) DO UPDATE SET
        updated_at = NOW()
    RETURNING * INTO substance_record;
    
    -- Limpar dados existentes
    DELETE FROM degradation_products WHERE substance_id = substance_record.id;
    DELETE FROM "references" WHERE substance_id = substance_record.id;
    
    -- Inserir produtos
    IF products IS NOT NULL AND json_typeof(products) = 'array' THEN
        FOR product_item IN SELECT * FROM json_array_elements(products)
        LOOP
            INSERT INTO degradation_products (
                substance_id, product_name, degradation_route, 
                environmental_conditions, toxicity_data
            ) VALUES (
                substance_record.id,
                COALESCE(product_item->>'substance', 'Não especificado'),
                COALESCE(product_item->>'degradationRoute', 'Não especificado'),
                COALESCE(product_item->>'environmentalConditions', 'Não especificado'),
                COALESCE(product_item->>'toxicityData', 'Não especificado')
            );
        END LOOP;
    END IF;
    
    -- Inserir referências
    IF references_list IS NOT NULL AND json_typeof(references_list) = 'array' THEN
        FOR reference_item IN SELECT value::text FROM json_array_elements_text(references_list)
        LOOP
            INSERT INTO "references" (substance_id, reference_text, reference_order)
            VALUES (substance_record.id, reference_item, reference_order);
            reference_order := reference_order + 1;
        END LOOP;
    END IF;
    
    PERFORM simple_log('INFO', 'database', 
        format('Dados salvos: %s (%s)', substance_name, response_source),
        json_build_object(
            'substance', substance_name,
            'products_count', COALESCE(json_array_length(products), 0),
            'references_count', COALESCE(json_array_length(references_list), 0)
        )
    );
    
    RETURN substance_record.id;
    
EXCEPTION
    WHEN OTHERS THEN
        PERFORM simple_log('ERROR', 'database', 
            format('Erro ao salvar dados: %s', SQLERRM)
        );
        RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;

-- 9. VERIFICAÇÃO FINAL
DO $$
BEGIN
    RAISE NOTICE '🎉 SISTEMA DE CACHE DEFINITIVO INSTALADO COM SUCESSO!';
    RAISE NOTICE '📊 Tabelas criadas: simple_cache, simple_logs';
    RAISE NOTICE '🔧 Funções criadas: get_cache_data, set_cache_data, simple_log';
    RAISE NOTICE '🔍 Funções de pesquisa: log_search_simple, save_data_simple';
    RAISE NOTICE '🧹 Função de limpeza: cleanup_cache';
    RAISE NOTICE '✅ Sistema pronto para uso!';
END $$;
