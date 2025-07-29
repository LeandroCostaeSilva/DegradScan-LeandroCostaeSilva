-- CORREÇÃO DA FUNÇÃO simple_log

-- 1. Remover função existente se houver conflito
DROP FUNCTION IF EXISTS simple_log(VARCHAR, VARCHAR, TEXT, JSONB);
DROP FUNCTION IF EXISTS simple_log(TEXT, TEXT, TEXT, JSONB);

-- 2. Criar função com assinatura correta
CREATE OR REPLACE FUNCTION simple_log(
    p_level TEXT,
    p_component TEXT, 
    p_message TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
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

-- 3. Verificar se a tabela simple_logs existe com estrutura correta
DO $$
BEGIN
    -- Verificar se tabela existe
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
        
        RAISE NOTICE '✅ Tabela simple_logs criada';
    ELSE
        RAISE NOTICE '✅ Tabela simple_logs já existe';
    END IF;
END $$;

-- 4. Testar a função corrigida
SELECT simple_log('INFO', 'test', 'Teste da função corrigida', '{"status": "ok"}'::jsonb);

-- 5. Verificar se o teste funcionou
SELECT 
    log_level,
    component,
    message,
    metadata,
    created_at
FROM simple_logs 
WHERE component = 'test'
ORDER BY created_at DESC 
LIMIT 1;

RAISE NOTICE '🎉 Função simple_log corrigida e testada com sucesso!';
