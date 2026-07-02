import { PrimaryButton, SecondaryButton, DestructiveButton, ImageButton, IconButton, NavigationButton, SwitchButton } from '../components/ui/Buttons';
import { InputField, PasswordField, SelectField, TextArea } from '../components/ui/Textfields';
import { Badge } from '../components/ui/Badges';
import { Box, CheckCircle, Clock, Filter } from 'lucide-react';

const STATUS_OPTIONS = [
    { value: 'PUBLISHED', label: 'Published', icon: CheckCircle },
    { value: 'PENDING', label: 'Pending Review', icon: Clock },
];

export default function Login() {
    return (
        <div className="rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
            <h1 className="mb-4 text-2xl font-bold">University DMS</h1>
            <p className="mb-6 text-muted">This is the dummy Login Page.</p>

            <InputField leftIcon={Box} placeholder="Email" />

            <br />

            <PasswordField icon={Box} placeholder="Password" />

            <br />

            <SelectField icon={Filter} placeholder="Select by Status" options={STATUS_OPTIONS} />

            <br />

            <TextArea icon={Box} placeholder="Message" />

            <br />

            <Badge label="Published" variant="success" size="small" />
            <Badge label="Published" variant="success" size="medium" />
            <Badge label="Published" variant="success" size="large" />

            <br />

            <Badge label="Pending Director" variant="warning" size="small" />
            <Badge label="Pending Director" variant="warning" size="medium" />
            <Badge label="Pending Director" variant="warning" size="large" />

            <br />

            <Badge label="Rejected" variant="error" size="small" />
            <Badge label="Rejected" variant="error" size="medium" />
            <Badge label="Rejected" variant="error" size="large" />

            <br />

            <Badge label="Uploaded" variant="neutral" size="small" />
            <Badge label="Uploaded" variant="neutral" size="medium" />
            <Badge label="Uploaded" variant="neutral" size="large" />

            <br />
        </div>
    );
}
