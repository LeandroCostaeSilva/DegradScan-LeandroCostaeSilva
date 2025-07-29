-- Adicionar colunas ausentes na tabela search_history se não existirem
DO $$
BEGIN
    -- Adicionar coluna api_response_cached se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_history' 
        AND column_name = 'api_response_cached'
    ) THEN
        ALTER TABLE search_history ADD COLUMN api_response_cached BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna api_response_cached adicionada à tabela search_history';
    ELSE
        RAISE NOTICE 'Coluna api_response_cached já existe na tabela search_history';
    END IF;

    -- Adicionar coluna response_source se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_history' 
        AND column_name = 'response_source'
    ) THEN
        ALTER TABLE search_history ADD COLUMN response_source VARCHAR(50) DEFAULT 'unknown';
        RAISE NOTICE 'Coluna response_source adicionada à tabela search_history';
    ELSE
        RAISE NOTICE 'Coluna response_source já existe na tabela search_history';
    END IF;
END $$;

-- Criar tabela api_responses se não existir
CREATE TABLE IF NOT EXISTS api_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    substance_id UUID NOT NULL REFERENCES substances(id) ON DELETE CASCADE,
    search_term VARCHAR(255) NOT NULL,
    response_data JSONB NOT NULL,
    response_source VARCHAR(50) NOT NULL,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_api_responses_substance_id ON api_responses(substance_id);
CREATE INDEX IF NOT EXISTS idx_api_responses_timestamp ON api_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_search_history_response_source ON search_history(response_source);

-- Verificar estrutura das tabelas
DO $$
BEGIN
    RAISE NOTICE 'Verificando estrutura das tabelas:';
    
    -- Verificar colunas da tabela search_history
    RAISE NOTICE 'Colunas da tabela search_history:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'search_history'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % (nullable: %, default: %)', 
            rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
    END LOOP;
    
    -- Verificar se tabela api_responses existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_responses') THEN
        RAISE NOTICE 'Tabela api_responses: EXISTS';
    ELSE
        RAISE NOTICE 'Tabela api_responses: NOT EXISTS';
    END IF;
END $$;
