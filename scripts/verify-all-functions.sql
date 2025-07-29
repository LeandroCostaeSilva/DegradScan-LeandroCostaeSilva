-- Verificar se todas as funções necessárias existem

-- 1. Listar todas as funções criadas
SELECT 
    routine_name as function_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'simple_log',
    'get_cache_data', 
    'set_cache_data',
    'cleanup_cache',
    'log_search_simple',
    'save_data_simple',
    'get_substance_data'
)
ORDER BY routine_name;

-- 2. Verificar assinaturas das funções principais
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('simple_log', 'get_cache_data', 'set_cache_data')
ORDER BY p.proname;

-- 3. Testar cada função individualmente
DO $$
DECLARE
    test_result UUID;
    cache_result JSONB;
    cache_set_result BOOLEAN;
BEGIN
    RAISE NOTICE '🧪 Testando todas as funções...';
    
    -- Teste 1: simple_log
    BEGIN
        SELECT simple_log('INFO', 'function_test', 'Testando simple_log') INTO test_result;
        RAISE NOTICE '✅ simple_log: OK (ID: %)', test_result;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ simple_log: ERRO - %', SQLERRM;
    END;
    
    -- Teste 2: get_cache_data
    BEGIN
        SELECT get_cache_data('test_function_check') INTO cache_result;
        RAISE NOTICE '✅ get_cache_data: OK (resultado: %)', COALESCE(cache_result::text, 'NULL');
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ get_cache_data: ERRO - %', SQLERRM;
    END;
    
    -- Teste 3: set_cache_data
    BEGIN
        SELECT set_cache_data('test_function_check', 'test_substance', '{"test": true}'::jsonb, 'test') INTO cache_set_result;
        RAISE NOTICE '✅ set_cache_data: OK (resultado: %)', cache_set_result;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ set_cache_data: ERRO - %', SQLERRM;
    END;
    
    -- Teste 4: cleanup_cache
    BEGIN
        PERFORM cleanup_cache();
        RAISE NOTICE '✅ cleanup_cache: OK';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ cleanup_cache: ERRO - %', SQLERRM;
    END;
    
    RAISE NOTICE '🎉 Verificação de funções concluída!';
END $$;
