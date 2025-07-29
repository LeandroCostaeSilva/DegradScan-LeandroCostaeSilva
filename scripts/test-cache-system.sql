-- Script para testar o sistema de cache

-- 1. Testar função de cache
SELECT get_cache_data('test_key_123');

-- 2. Salvar dados no cache
SELECT set_cache_data(
    'test_key_123',
    'paracetamol',
    '{"products": [{"substance": "teste"}], "references": ["ref1"]}'::jsonb,
    'test'
);

-- 3. Verificar se foi salvo
SELECT get_cache_data('test_key_123');

-- 4. Ver estatísticas do cache
SELECT 
    cache_key,
    substance_name,
    cache_source,
    hit_count,
    created_at,
    expires_at,
    last_accessed
FROM simple_cache
ORDER BY created_at DESC
LIMIT 10;

-- 5. Ver logs do sistema
SELECT 
    log_level,
    component,
    message,
    created_at
FROM simple_logs
ORDER BY created_at DESC
LIMIT 20;

-- 6. Limpar cache expirado
SELECT cleanup_cache();

-- 7. Testar log simples
SELECT simple_log('INFO', 'test', 'Teste do sistema de log', '{"test": true}'::jsonb);
