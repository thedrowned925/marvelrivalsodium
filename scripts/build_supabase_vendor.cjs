const esbuild=require('esbuild'),fs=require('fs');
esbuild.buildSync({stdin:{contents:"export {createClient} from '@supabase/supabase-js';",resolveDir:process.cwd()},bundle:true,minify:true,format:'iife',globalName:'OdiumSupabase',platform:'browser',target:['es2022'],outfile:'assets/vendor/supabase-2.115.0.js',legalComments:'eof'});
fs.copyFileSync('node_modules/@supabase/supabase-js/LICENSE','assets/vendor/supabase-LICENSE');
