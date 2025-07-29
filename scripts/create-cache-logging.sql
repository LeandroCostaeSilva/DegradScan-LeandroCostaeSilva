-- Sistema de cache e logging avançado

-- Tabela para logs detalhados do sistema
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    log_level VARCHAR(20) NOT NULL DEFAULT 'INFO', -- DEBUG, INFO, WARN, ERROR
    component VARCHAR(50) NOT NULL, -- 'search', 'cache', 'api', 'database'
    action VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    user_ip VARCHAR(45),
    user_agent TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance dos logs
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_system_logs_component ON system_logs(component);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Tabela para cache de pesquisas
CREATE TABLE IF NOT EXISTS search_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    substance_name VARCHAR(255) NOT NULL,
    cached_data JSONB NOT NULL,
    cache_source VARCHAR(50) NOT NULL, -- 'database', 'api', 'mock'
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para cache
CREATE INDEX IF NOT EXISTS idx_search_cache_key ON search_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_search_cache_substance ON search_cache(substance_name);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache(expires_at);

-- Função para registrar logs do sistema
CREATE OR REPLACE FUNCTION log_system_event(
    p_level VARCHAR(20),
    p_component VARCHAR(50),
    p_action VARCHAR(100),
    p_message TEXT,
    p_metadata JSONB DEFAULT '{}',
    p_user_ip VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_processing_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO system_logs (
        log_level, component, action, message, metadata,
        user_ip, user_agent, processing_time_ms
    ) VALUES (
        p_level, p_component, p_action, p_message, p_metadata,
        p_user_ip, p_user_agent, p_processing_time_ms
    ) RETURNING id INTO log_id;
    
    -- Também fazer RAISE NOTICE para debug imediato
    RAISE NOTICE '[%] [%] %: % (ID: %)', 
        p_level, p_component, p_action, p_message, log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Função para gerenciar cache de pesquisas
CREATE OR REPLACE FUNCTION get_or_set_cache(
    p_cache_key VARCHAR(255),
    p_substance_name VARCHAR(255),
    p_data JSONB DEFAULT NULL,
    p_source VARCHAR(50) DEFAULT 'unknown'
)
RETURNS JSONB AS $$
DECLARE
    cached_record RECORD;
    result JSONB;
BEGIN
    -- Tentar buscar no cache
    SELECT * INTO cached_record
    FROM search_cache 
    WHERE cache_key = p_cache_key 
    AND expires_at > NOW();
    
    IF cached_record IS NOT NULL THEN
        -- Cache hit - atualizar contadores
        UPDATE search_cache 
        SET hit_count = hit_count + 1,
            last_accessed = NOW()
        WHERE id = cached_record.id;
        
        -- Log do cache hit
        PERFORM log_system_event(
            'INFO', 'cache', 'hit',
            format('Cache hit para %s', p_substance_name),
            json_build_object(
                'cache_key', p_cache_key,
                'hit_count', cached_record.hit_count + 1,
                'source', cached_record.cache_source
            )
        );
        
        RETURN cached_record.cached_data;
    ELSE
        -- Cache miss
        IF p_data IS NOT NULL THEN
            -- Salvar no cache
            INSERT INTO search_cache (
                cache_key, substance_name, cached_data, cache_source
            ) VALUES (
                p_cache_key, p_substance_name, p_data, p_source
            ) ON CONFLICT (cache_key) DO UPDATE SET
                cached_data = EXCLUDED.cached_data,
                cache_source = EXCLUDED.cache_source,
                hit_count = 0,
                last_accessed = NOW(),
                expires_at = NOW() + INTERVAL '24 hours';
            
            -- Log do cache set
            PERFORM log_system_event(
                'INFO', 'cache', 'set',
                format('Cache definido para %s', p_substance_name),
                json_build_object(
                    'cache_key', p_cache_key,
                    'source', p_source,
                    'data_size', length(p_data::text)
                )
            );
            
            RETURN p_data;
        ELSE
            -- Cache miss sem dados para salvar
            PERFORM log_system_event(
                'INFO', 'cache', 'miss',
                format('Cache miss para %s', p_substance_name),
                json_build_object('cache_key', p_cache_key)
            );
            
            RETURN NULL;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM search_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    PERFORM log_system_event(
        'INFO', 'cache', 'cleanup',
        format('Limpeza de cache: %s registros removidos', deleted_count),
        json_build_object('deleted_count', deleted_count)
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- View para estatísticas de cache
CREATE OR REPLACE VIEW cache_statistics AS
SELECT 
    cache_source,
    COUNT(*) as total_entries,
    SUM(hit_count) as total_hits,
    AVG(hit_count) as avg_hits_per_entry,
    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_entries,
    COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_entries,
    MAX(last_accessed) as last_access,
    MIN(created_at) as oldest_entry
FROM search_cache
GROUP BY cache_source
ORDER BY total_hits DESC;

-- View para logs recentes
CREATE OR REPLACE VIEW recent_system_logs AS
SELECT 
    log_level,
    component,
    action,
    message,
    metadata,
    processing_time_ms,
    created_at
FROM system_logs
ORDER BY created_at DESC
LIMIT 100;
