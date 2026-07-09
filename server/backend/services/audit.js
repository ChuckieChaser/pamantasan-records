export async function logAudit(client, params) {
    const { actor_id, entity_type, entity_id, action, data } = params;
    
    // We execute this query within the same transaction client provided by withRLS.
    await client.query(
        'INSERT INTO audit_logs (actor_id, entity_type, entity_id, action, data) VALUES ($1, $2, $3, $4, $5)',
        [actor_id || null, entity_type, entity_id, action, JSON.stringify(data || {})]
    );
}
