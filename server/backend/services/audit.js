export async function logAudit(client, params) {
    const { actor_id, entity_type, entity_id, action, data } = params;
    
    try {
        await client.query(
            'INSERT INTO audit_logs (actor_id, entity_type, entity_id, action, data) VALUES ($1, $2, $3, $4, $5)',
            [actor_id || null, entity_type, entity_id, action, JSON.stringify(data || {})]
        );
    } catch (err) {
        // Audit failures must NEVER abort the parent business action.
        console.error('[AUDIT] Failed to write audit log:', err.message, { entity_type, entity_id, action });
    }
}
