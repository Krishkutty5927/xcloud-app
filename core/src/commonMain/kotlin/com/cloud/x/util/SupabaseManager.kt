package com.cloud.x.util

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.storage.Storage

object SupabaseManager {
    // REPLACE THESE with your actual Supabase Project URL and Anon Key
    private const val SUPABASE_URL = "https://pggjchnnglmzshtetnia.supabase.co"
    private const val SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2pjaG5uZ2xtenNodGV0bmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NzUzODEsImV4cCI6MjEwMzI1MTM4MX0.VKYcTygVKpdNsnCcHDFuxkx07t1GTQFABj-EQs2h5Cw"

    val client: SupabaseClient by lazy {
        createSupabaseClient(
            supabaseUrl = SUPABASE_URL,
            supabaseKey = SUPABASE_KEY
        ) {
            install(Storage)
            install(Postgrest)
        }
    }
}
