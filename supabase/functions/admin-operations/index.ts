
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdminOperationRequest {
  operation: string;
  count?: number;
  producerId?: string;
  beatIds?: string[];
  beatId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client for admin operations (uses service role key)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { operation, count = 5, producerId, beatIds, beatId }: AdminOperationRequest = await req.json()
    
    if (operation === 'set_producer_of_week') {
      if (!producerId) {
        throw new Error('Producer ID is required for this operation')
      }
      
      console.log(`Admin requested to set producer ${producerId} as producer of the week`)
      
      // Step 1: Reset all current producers of the week
      const { error: resetError } = await supabase
        .from('users')
        .update({ is_producer_of_week: false })
        .eq('is_producer_of_week', true)
      
      if (resetError) {
        console.error('Error resetting producer of the week:', resetError)
        throw new Error('Failed to reset current producer of the week')
      }

      // Step 2: Verify the producer exists and is a producer
      const { data: producerData, error: producerError } = await supabase
        .from('users')
        .select('id, stage_name, full_name, role')
        .eq('id', producerId)
        .eq('role', 'producer')
        .single()
      
      if (producerError || !producerData) {
        console.error('Error finding producer:', producerError)
        throw new Error('Producer not found or is not a valid producer')
      }

      // Step 3: Set the new producer of the week
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_producer_of_week: true })
        .eq('id', producerId)
      
      if (updateError) {
        console.error('Error setting producer of the week:', updateError)
        throw new Error('Failed to set producer of the week')
      }

      console.log(`Successfully set ${producerData.stage_name || producerData.full_name} as producer of the week`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          producer_id: producerId,
          producer_name: producerData.stage_name || producerData.full_name
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Manual selection of trending beats
    if (operation === 'set_trending_beats') {
      if (!beatIds || !Array.isArray(beatIds) || beatIds.length === 0) {
        throw new Error('Beat IDs array is required for this operation')
      }
      
      if (beatIds.length > 5) {
        throw new Error('Maximum 5 trending beats allowed')
      }
      
      console.log(`Admin manually setting trending beats:`, beatIds)
      
      // Reset all trending beats
      const { error: resetError } = await supabase
        .from('beats')
        .update({ is_trending: false })
        .eq('status', 'published')
      
      if (resetError) {
        console.error('Error resetting trending beats:', resetError)
        throw new Error('Failed to reset trending beats')
      }

      // Set selected beats as trending
      const { error: updateError } = await supabase
        .from('beats')
        .update({ is_trending: true })
        .in('id', beatIds)
      
      if (updateError) {
        console.error('Error updating trending beats:', updateError)
        throw new Error('Failed to update trending beats')
      }

      console.log(`Successfully set ${beatIds.length} beats as trending`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated_count: beatIds.length,
          beat_ids: beatIds 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Manual selection of featured beat
    if (operation === 'set_featured_beat') {
      if (!beatId) {
        throw new Error('Beat ID is required for this operation')
      }
      
      console.log(`Admin manually setting featured beat:`, beatId)
      
      // Reset all featured beats
      const { error: resetError } = await supabase
        .from('beats')
        .update({ is_featured: false })
        .eq('status', 'published')
      
      if (resetError) {
        console.error('Error resetting featured beats:', resetError)
        throw new Error('Failed to reset featured beats')
      }

      // Set selected beat as featured
      const { error: updateError } = await supabase
        .from('beats')
        .update({ is_featured: true })
        .eq('id', beatId)
      
      if (updateError) {
        console.error('Error updating featured beat:', updateError)
        throw new Error('Failed to update featured beat')
      }

      console.log(`Successfully set beat ${beatId} as featured`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated_count: 1,
          beat_ids: [beatId] 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
    if (operation === 'refresh_trending_beats') {
      console.log(`Admin requested trending beats refresh with count: ${count}`)
      
      // Start transaction - reset all trending beats to false
      const { error: resetError } = await supabase
        .from('beats')
        .update({ is_trending: false })
        .eq('status', 'published')
      
      if (resetError) {
        console.error('Error resetting trending beats:', resetError)
        throw new Error('Failed to reset trending beats')
      }

      // Get weighted random published beats to set as trending
      const { data: randomBeats, error: selectError } = await supabase
        .rpc('get_weighted_random_beats', { beat_count: count, category: 'trending' })
      
      if (selectError) {
        console.error('Error selecting random beats:', selectError)
        throw new Error('Failed to select random beats')
      }

      if (!randomBeats || randomBeats.length === 0) {
        throw new Error('No published beats available to set as trending')
      }

      // Set selected beats as trending
      const beatIdsList = randomBeats.map((beat: any) => beat.id)
      const { error: updateError } = await supabase
        .from('beats')
        .update({ is_trending: true })
        .in('id', beatIdsList)
      
      if (updateError) {
        console.error('Error updating trending beats:', updateError)
        throw new Error('Failed to update trending beats')
      }

      // Log the operation for audit purposes
      console.log(`Successfully updated ${beatIdsList.length} beats as trending:`, beatIdsList)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated_count: beatIdsList.length,
          beat_ids: beatIdsList 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
    if (operation === 'refresh_featured_beats') {
      const featuredCount = Math.min(count || 1, 1) // Enforce max 1 featured beat
      console.log(`Admin requested featured beats refresh with count: ${featuredCount}`)
      
      // Step 1: Reset all featured beats to false
      const { error: resetError } = await supabase
        .from('beats')
        .update({ is_featured: false })
        .eq('status', 'published')
      
      if (resetError) {
        console.error('Error resetting featured beats:', resetError)
        throw new Error('Failed to reset featured beats')
      }

      // Step 2: Get weighted random published beats to set as featured
      const { data: randomBeats, error: selectError } = await supabase
        .rpc('get_weighted_random_beats', { beat_count: featuredCount, category: 'featured' })
      
      if (selectError) {
        console.error('Error selecting random beats for featured:', selectError)
        throw new Error('Failed to select random beats for featured')
      }

      if (!randomBeats || randomBeats.length === 0) {
        throw new Error('No published beats available to set as featured')
      }

      // Step 3: Set selected beats as featured
      const beatIdsList = randomBeats.map((beat: any) => beat.id)
      const { error: updateError } = await supabase
        .from('beats')
        .update({ is_featured: true })
        .in('id', beatIdsList)
      
      if (updateError) {
        console.error('Error updating featured beats:', updateError)
        throw new Error('Failed to update featured beats')
      }

      console.log(`Successfully updated ${beatIdsList.length} beats as featured:`, beatIdsList)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated_count: beatIdsList.length,
          beat_ids: beatIdsList 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
    if (operation === 'refresh_weekly_picks') {
      const weeklyCount = Math.max(5, Math.min(count || 6, 7)) // Enforce 5-7 range
      console.log(`Admin requested weekly picks refresh with count: ${weeklyCount}`)
      
      // Step 1: Reset all weekly picks to false
      const { error: resetError } = await supabase
        .from('beats')
        .update({ is_weekly_pick: false })
        .eq('status', 'published')
      
      if (resetError) {
        console.error('Error resetting weekly picks:', resetError)
        throw new Error('Failed to reset weekly picks')
      }

      // Step 2: Get weighted random published beats to set as weekly picks
      const { data: randomBeats, error: selectError } = await supabase
        .rpc('get_weighted_random_beats', { beat_count: weeklyCount, category: 'weekly_pick' })
      
      if (selectError) {
        console.error('Error selecting random beats for weekly picks:', selectError)
        throw new Error('Failed to select random beats for weekly picks')
      }

      if (!randomBeats || randomBeats.length === 0) {
        throw new Error('No published beats available to set as weekly picks')
      }

      // Step 3: Set selected beats as weekly picks
      const beatIdsList = randomBeats.map((beat: any) => beat.id)
      const { error: updateError } = await supabase
        .from('beats')
        .update({ is_weekly_pick: true })
        .in('id', beatIdsList)
      
      if (updateError) {
        console.error('Error updating weekly picks:', updateError)
        throw new Error('Failed to update weekly picks')
      }

      console.log(`Successfully updated ${beatIdsList.length} beats as weekly picks:`, beatIdsList)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated_count: beatIdsList.length,
          beat_ids: beatIdsList 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
    throw new Error(`Unknown operation: ${operation}`)
    
  } catch (error) {
    console.error('Admin operation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
