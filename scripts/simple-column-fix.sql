-- Versão simplificada sem loops complexos
-- Adicionar colunas ausentes na tabela search_history

-- Verificar e adicionar api_response_cached
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_history' 
        AND column_name = 'api_response_cached'
    ) THEN
        ALTER TABLE search_history ADD COLUMN api_response_cached BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Coluna api_response_cached adicionada';
    ELSE
        RAISE NOTICE '✅ Coluna api_response_cached já existe';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao adicionar api_response_cached: %', SQLERRM;
END $$;

-- Verificar e adicionar response_source
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'search_history' 
        AND column_name = 'response_source'
    ) THEN
        ALTER TABLE search_history ADD COLUMN response_source VARCHAR(50) DEFAULT 'unknown';
        RAISE NOTICE '✅ Coluna response_source adicionada';
    ELSE
        RAISE NOTICE '✅ Coluna response_source já existe';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao adicionar response_source: %', SQLERRM;
END $$;

-- Criar tabela api_responses se não existir
DO $$
BEGIN
    CREATE TABLE IF NOT EXISTS api_responses (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        substance_id UUID NOT NULL REFERENCES substances(id) ON DELETE CASCADE,
        search_term VARCHAR(255) NOT NULL,
        response_data JSONB NOT NULL,
        response_source VARCHAR(50) NOT NULL,
        processing_time_ms INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE '✅ Tabela api_responses verificada/criada';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao criar api_responses: %', SQLERRM;
END $$;

-- Criar índices
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_api_responses_substance_id ON api_responses(substance_id);
    CREATE INDEX IF NOT EXISTS idx_api_responses_timestamp ON api_responses(created_at);
    CREATE INDEX IF NOT EXISTS idx_search_history_response_source ON search_history(response_source);
    RAISE NOTICE '✅ Índices criados/verificados';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao criar índices: %', SQLERRM;
END $$;

-- Verificação simples das tabelas
SELECT 
    'search_history' as tabela,
    COUNT(*) as total_colunas
FROM information_schema.columns 
WHERE table_name = 'search_history'

UNION ALL

SELECT 
    'api_responses' as tabela,
    COUNT(*) as total_colunas
FROM information_schema.columns 
WHERE table_name = 'api_responses'

UNION ALL

SELECT 
    'substances' as tabela,
    COUNT(*) as total_colunas
FROM information_schema.columns 
WHERE table_name = 'substances';
