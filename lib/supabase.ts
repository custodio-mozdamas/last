
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dlwbcggkeiafjhfuvhjr.supabase.co';
// Nota: A chave fornecida pelo usuário possui prefixo de Stripe, mas será usada conforme solicitado para a integração Supabase.
const SUPABASE_ANON_KEY = 'sb_publishable_Nytr9ypz8GSPjt8EhkrI9g_ae4AM9OB';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
