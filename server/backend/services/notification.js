export async function createNotification(client, originalRole, params) {
    const { recipient_id, actor_id, entity_type, entity_id, action } = params;

    // Notifications can only be inserted by SYSTEM per RLS policies.
    // We temporarily elevate the current transaction's role to SYSTEM, insert, then revert.
    // IMPORTANT: A notification failure must NEVER abort the parent business action.
    try {
        await client.query(`SET LOCAL app.user_current_role = 'SYSTEM'`);
        await client.query(
            `INSERT INTO notifications (recipient_id, actor_id, entity_type, entity_id, action)
             VALUES ($1, $2, $3, $4, $5)`,
            [recipient_id, actor_id || null, entity_type, entity_id, action]
        );
    } catch (err) {
        console.error('[NOTIFICATION] Failed to create notification:', err.message, { entity_type, entity_id, action });
    } finally {
        await client.query(`SET LOCAL app.user_current_role = '${originalRole || 'SYSTEM'}'`);
    }
}
