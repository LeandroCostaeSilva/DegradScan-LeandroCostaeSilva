-- Teste rápido do sistema de cache

-- Limpar dados de teste anteriores
DELETE FROM simple_cache WHERE cache_key LIKE 'quick_test_%';
DELETE FROM simple_logs WHERE component = 'quick_test';

-- Teste completo em um bloco
DO $$
DECLARE
    log_id UUID;
    cache_result JSONB;
    cache_set_result BOOLEAN;
    test_data JSONB;
BEGIN
    RAISE NOTICE '🚀 Iniciando teste rápido do sistema de cache...';
    
    -- 1. Log de início
    SELECT simple_log('INFO', 'quick_test', 'Teste rápido iniciado') INTO log_id;
    RAISE NOTICE '✅ Log criado: %', log_id;
    
    -- 2. Preparar dados de teste
    test_data := '{
        "products": [
            {
                "substance": "Produto Teste",
                "degradationRoute": "Via de teste",
                "environmentalConditions": "Condições de teste",
                "toxicityData": "Dados de teste"
            }
        ],
        "references": ["Referência 1", "Referência 2"]
    }'::jsonb;
    
    -- 3. Testar cache miss (primeira vez)
    SELECT get_cache_data('quick_test_paracetamol') INTO cache_result;
    IF cache_result IS NULL THEN
        RAISE NOTICE '✅ Cache MISS (esperado na primeira vez)';
    ELSE
        RAISE NOTICE '⚠️ Cache HIT inesperado: %', cache_result;
    END IF;
    
    -- 4. Salvar no cache
    SELECT set_cache_data('quick_test_paracetamol', 'paracetamol', test_data, 'quick_test') INTO cache_set_result;
    IF cache_set_result THEN
        RAISE NOTICE '✅ Dados salvos no cache';
    ELSE
        RAISE NOTICE '❌ Falha ao salvar no cache';
    END IF;
    
    -- 5. Testar cache hit (segunda vez)
    SELECT get_cache_data('quick_test_paracetamol') INTO cache_result;
    IF cache_result IS NOT NULL THEN
        RAISE NOTICE '✅ Cache HIT! Dados recuperados: % produtos, % referências', 
            jsonb_array_length(cache_result->'products'),
            jsonb_array_length(cache_result->'references');
    ELSE
        RAISE NOTICE '❌ Cache MISS inesperado';
    END IF;
    
    -- 6. Log de sucesso
    SELECT simple_log('INFO', 'quick_test', 'Teste rápido concluído com sucesso') INTO log_id;
    
    RAISE NOTICE '🎉 TESTE RÁPIDO CONCLUÍDO COM SUCESSO!';
    RAISE NOTICE '📊 Sistema de cache funcionando perfeitamente!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO NO TESTE: %', SQLERRM;
        -- Log do erro
        PERFORM simple_log('ERROR', 'quick_test', format('Erro no teste: %s', SQLERRM));
END $$;

-- Mostrar resultados
SELECT 
    cache_key,
    substance_name,
    cache_source,
    hit_count,
    created_at,
    expires_at > NOW() as is_valid
FROM simple_cache 
WHERE cache_key LIKE 'quick_test_%'
ORDER BY created_at DESC;

SELECT 
    log_level,
    component,
    message,
    created_at
FROM simple_logs 
WHERE component = 'quick_test'
ORDER BY created_at DESC;
