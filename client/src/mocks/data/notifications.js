import { NotificationsSchema } from '../../schemas';
import { NOTIFICATIONS_ENTITY_TYPE, NOTIFICATIONS_ACTION } from '../../constants';
import { ADMINISTRATOR_ID, COORDINATOR_ID, DIRECTOR_ID, OFFICER_ID, HR_MEMBER_ID } from './users';
import { DOCUMENT_1_ID, DOCUMENT_REQUEST_2_ID } from './documents';
import { COORDINATOR_REQUEST_3_ID } from './coordinators';

// --- Global Constants ---
export const NOTIFICATION_1_ID = 'n0000000-0000-4000-8000-000000000001';
export const NOTIFICATION_2_ID = 'n0000000-0000-4000-8000-000000000002';
export const NOTIFICATION_3_ID = 'n0000000-0000-4000-8000-000000000003';
export const NOTIFICATION_4_ID = 'n0000000-0000-4000-8000-000000000004';

const FIVE_MINUTES_AGO = new Date(Date.now() - 300000).toISOString();
const TEN_MINUTES_AGO = new Date(Date.now() - 600000).toISOString();
const YESTERDAY = new Date(Date.now() - 86400000).toISOString();
const TWO_DAYS_AGO = new Date(Date.now() - 172800000).toISOString();

// --- Raw Data ---
const rawNotifications = [
    {
        id: NOTIFICATION_1_ID,
        recipient_id: ADMINISTRATOR_ID,
        actor_id: OFFICER_ID,
        entity_type: NOTIFICATIONS_ENTITY_TYPE.DOCUMENT,
        entity_id: DOCUMENT_1_ID,
        action: NOTIFICATIONS_ACTION.COMMENTED,
        is_read: false,
        is_emailed: false,
        created_at: TEN_MINUTES_AGO,
        updated_at: TEN_MINUTES_AGO,
    },
    {
        id: NOTIFICATION_2_ID,
        recipient_id: ADMINISTRATOR_ID,
        actor_id: DIRECTOR_ID,
        entity_type: NOTIFICATIONS_ENTITY_TYPE.DOCUMENT,
        entity_id: DOCUMENT_1_ID,
        action: NOTIFICATIONS_ACTION.COMMENTED,
        is_read: false,
        is_emailed: false,
        created_at: FIVE_MINUTES_AGO,
        updated_at: FIVE_MINUTES_AGO,
    },
    {
        id: NOTIFICATION_3_ID,
        recipient_id: COORDINATOR_ID,
        actor_id: ADMINISTRATOR_ID,
        entity_type: NOTIFICATIONS_ENTITY_TYPE.COORDINATOR_REQUEST,
        entity_id: COORDINATOR_REQUEST_3_ID,
        action: NOTIFICATIONS_ACTION.REJECTED,
        is_read: false,
        is_emailed: false,
        created_at: YESTERDAY,
        updated_at: YESTERDAY,
    },
    {
        id: NOTIFICATION_4_ID,
        recipient_id: HR_MEMBER_ID,
        actor_id: ADMINISTRATOR_ID,
        entity_type: NOTIFICATIONS_ENTITY_TYPE.DOCUMENT_REQUEST,
        entity_id: DOCUMENT_REQUEST_2_ID,
        action: NOTIFICATIONS_ACTION.RESOLVED,
        is_read: true,
        is_emailed: true,
        created_at: TWO_DAYS_AGO,
        updated_at: TWO_DAYS_AGO,
    },
];

// --- Strict Validation ---
export const notificationsData = rawNotifications.map((n) => NotificationsSchema.parse(n));
