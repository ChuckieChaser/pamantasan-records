import { NotificationsSchema } from '../../schemas';
import { NOTIFICATIONS_ENTITY_TYPE, NOTIFICATIONS_ACTION } from '../../constants';
import { ADMINISTRATOR_ID, MEMBER_ID, OFFICER_ID } from './users';
import { DOCUMENT_1_ID } from './documents';
import { COORDINATOR_REQUEST_1_ID } from './coordinators';

// --- Global Constants ---
export const NOTIFICATION_1_ID = '11071111-1111-4111-8111-111111111111';
export const NOTIFICATION_2_ID = '11072222-2222-4222-8222-222222222222';
export const NOTIFICATION_3_ID = '11073333-3333-4333-8333-333333333333';

const NOW = new Date().toISOString();
const TEN_MINUTES_AGO = new Date(Date.now() - 600000).toISOString();

// --- Raw Data ---
const rawNotifications = [
    {
        id: NOTIFICATION_1_ID,
        recipient_id: ADMINISTRATOR_ID,
        actor_id: MEMBER_ID,
        entity_type: NOTIFICATIONS_ENTITY_TYPE.DOCUMENT,
        entity_id: DOCUMENT_1_ID,
        action: NOTIFICATIONS_ACTION.UPDATED,
        is_read: false,
        is_emailed: false,
        created_at: TEN_MINUTES_AGO,
        updated_at: TEN_MINUTES_AGO,
    },
    {
        id: NOTIFICATION_2_ID,
        recipient_id: ADMINISTRATOR_ID,
        actor_id: OFFICER_ID,
        entity_type: NOTIFICATIONS_ENTITY_TYPE.DOCUMENT,
        entity_id: DOCUMENT_1_ID,
        action: NOTIFICATIONS_ACTION.UPDATED,
        is_read: false,
        is_emailed: false,
        created_at: NOW,
        updated_at: NOW,
    },
    {
        id: NOTIFICATION_3_ID,
        recipient_id: ADMINISTRATOR_ID,
        actor_id: null,
        entity_type: NOTIFICATIONS_ENTITY_TYPE.COORDINATOR_REQUEST,
        entity_id: COORDINATOR_REQUEST_1_ID,
        action: NOTIFICATIONS_ACTION.CREATED,
        is_read: true,
        is_emailed: true,
        created_at: TEN_MINUTES_AGO,
        updated_at: NOW,
    },
];

// --- Strict Validation ---
export const notificationsData = rawNotifications.map((n) => NotificationsSchema.parse(n));
