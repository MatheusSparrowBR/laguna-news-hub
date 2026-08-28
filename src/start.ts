import { registerGlobalMiddleware } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

registerGlobalMiddleware({
  functionMiddleware: [attachSupabaseAuth],
});
