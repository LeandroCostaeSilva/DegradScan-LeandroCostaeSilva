-- Script de teste corrigido para o sistema de cache

-- 1. Testar log primeiro (para garantir que funciona)
DO $$
DECLARE
    log_result UUID;
BEGIN
    SELECT simple_log('INFO', 'cache_test', 'Iniciando teste do sistema de cache') INTO log_result;
    RAISE NOTICE 'Log criado com ID: %', log_result;
END $$;

-- 2. Limpar cache de teste anterior (se existir)
DELETE FROM simple_cache WHERE cache_key LIKE 'test_%';

-- 3. Testar cache miss (primeira vez)
SELECT get_cache_data('test_paracetamol') as cache_result;

-- 4. Salvar dados no cache
SELECT set_cache_data(
    'test_paracetamol',
    'paracetamol',
    '{
        "products": [
            {
                "substance": "N-acetil-p-benzoquinona imina (NAPQI)",
                "degradationRoute": "Oxidação metabólica via CYP2E1",
                "environmentalConditions": "pH fisiológico, temperatura corporal",
                "toxicityData": "Altamente hepatotóxico"
            }
        ],
        "references": [
            "Teste de referência 1",
            "Teste de referência 2"
        ]
    }'::jsonb,
    'test'
) as cache_set_result;

-- 5. Testar cache hit (segunda vez - deve retornar dados)
SELECT get_cache_data('test_paracetamol') as cache_hit_result;

-- 6. Ver estatísticas do cache
SELECT 
    cache_key,
    substance_name,
    cache_source,
    hit_count,
    created_at,
    expires_at > NOW() as is_valid,
    last_accessed
FROM simple_cache
WHERE cache_key LIKE 'test_%'
ORDER BY created_at DESC;

-- 7. Ver logs do sistema (últimos 10)
SELECT 
    log_level,
    component,
    message,
    metadata,
    created_at
FROM simple_logs
ORDER BY created_at DESC
LIMIT 10;

-- 8. Testar limpeza de cache
SELECT cleanup_cache() as cleanup_result;

-- 9. Estatísticas finais
SELECT 
    COUNT(*) as total_cache_entries,
    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as valid_entries,
    COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_entries,
    SUM(hit_count) as total_hits
FROM simple_cache;

-- 10. Logs finais
SELECT COUNT(*) as total_logs FROM simple_logs;

RAISE NOTICE '✅ Teste completo do sistema de cache finalizado!';
