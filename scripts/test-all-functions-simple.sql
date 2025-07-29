-- Teste simples e seguro de todas as funções

-- 1. Testar simple_log
DO $$
DECLARE
    log_result UUID;
BEGIN
    RAISE NOTICE '🧪 Testando simple_log...';
    SELECT simple_log('INFO', 'test_system', 'Sistema de teste iniciado', '{"version": "1.0"}'::jsonb) INTO log_result;
    RAISE NOTICE '✅ simple_log funcionando! ID: %', log_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro em simple_log: %', SQLERRM;
END $$;

-- 2. Testar get_cache_data (deve retornar NULL para chave inexistente)
DO $$
DECLARE
    cache_result JSONB;
BEGIN
    RAISE NOTICE '🧪 Testando get_cache_data...';
    SELECT get_cache_data('chave_inexistente_123') INTO cache_result;
    
    IF cache_result IS NULL THEN
        RAISE NOTICE '✅ get_cache_data funcionando! (NULL para chave inexistente)';
    ELSE
        RAISE NOTICE '⚠️ get_cache_data retornou dados inesperados: %', cache_result;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro em get_cache_data: %', SQLERRM;
END $$;

-- 3. Testar set_cache_data
DO $$
DECLARE
    cache_set_result BOOLEAN;
    test_data JSONB;
BEGIN
    RAISE NOTICE '🧪 Testando set_cache_data...';
    
    test_data := '{
        "products": [{"substance": "Teste", "degradationRoute": "Teste"}],
        "references": ["Referência de teste"]
    }'::jsonb;
    
    SELECT set_cache_data('teste_cache_123', 'substancia_teste', test_data, 'test') INTO cache_set_result;
    
    IF cache_set_result THEN
        RAISE NOTICE '✅ set_cache_data funcionando!';
    ELSE
        RAISE NOTICE '❌ set_cache_data retornou FALSE';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro em set_cache_data: %', SQLERRM;
END $$;

-- 4. Testar get_cache_data novamente (agora deve retornar dados)
DO $$
DECLARE
    cache_result JSONB;
BEGIN
    RAISE NOTICE '🧪 Testando get_cache_data com dados existentes...';
    SELECT get_cache_data('teste_cache_123') INTO cache_result;
    
    IF cache_result IS NOT NULL THEN
        RAISE NOTICE '✅ get_cache_data retornou dados! Tamanho: % chars', length(cache_result::text);
    ELSE
        RAISE NOTICE '❌ get_cache_data não encontrou dados salvos';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro em get_cache_data (segunda tentativa): %', SQLERRM;
END $$;

-- 5. Testar cleanup_cache
DO $$
DECLARE
    cleanup_result INTEGER;
BEGIN
    RAISE NOTICE '🧪 Testando cleanup_cache...';
    SELECT cleanup_cache() INTO cleanup_result;
    RAISE NOTICE '✅ cleanup_cache funcionando! Removidos: % registros', cleanup_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro em cleanup_cache: %', SQLERRM;
END $$;

-- 6. Verificar tabelas e dados
DO $$
DECLARE
    cache_count INTEGER;
    logs_count INTEGER;
BEGIN
    RAISE NOTICE '📊 Verificando dados nas tabelas...';
    
    -- Contar cache
    SELECT COUNT(*) INTO cache_count FROM simple_cache;
    RAISE NOTICE '📦 Cache: % registros', cache_count;
    
    -- Contar logs
    SELECT COUNT(*) INTO logs_count FROM simple_logs;
    RAISE NOTICE '📝 Logs: % registros', logs_count;
    
    RAISE NOTICE '🎉 Verificação completa finalizada!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro na verificação: %', SQLERRM;
END $$;
