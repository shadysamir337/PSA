const POLICY_URL =
    'https://aboutthesolution-my.sharepoint.com/personal/maraby_aboutthesolution_com/_layouts/15/onedrive.aspx?id=%2Fpersonal%2Fmaraby%5Faboutthesolution%5Fcom%2FDocuments%2FATS%2FHR%2FPolicy%2FATS%5FCompany%20Internal%20Policy%5F%D9%90%20August2021%2Epdf&parent=%2Fpersonal%2Fmaraby%5Faboutthesolution%5Fcom%2FDocuments%2FATS%2FHR%2FPolicy&ga=1'

export default function Policy() {
    return (
        <div className="tasks-page profile-page">
            <header className="page-header">
                <h1>📜 About The Solution Company Policy</h1>
                <p className="muted">Detailed company policies that govern the relationship between ATS and its employees.</p>
            </header>

            <div className="policy-card">
                <p>
                    This part provides detailed company policy which arrange the relation and work
                    between ATS and employees to gain the most proper employee satisfaction and work
                    productivity as well.
                </p>

                <p style={{ fontWeight: 600 }}>With this policy ATS employees get details and information of the following:</p>

                <ul className="policy-list">
                    <li>Company general instructions</li>
                    <li>Details about leaves, public holidays and attendance</li>
                    <li>Details about company travel policy</li>
                    <li>Details about training terms employee preparation as well</li>
                    <li>Details about employee resignation and instructions</li>
                </ul>

                <p>
                    Please read the policy carefully from{' '}
                    <a href={POLICY_URL} target="_blank" rel="noopener noreferrer" className="policy-here">HERE</a>!{' '}
                    You need to use your office 365 / ATS email and password — not the one used to login this portal.
                </p>

                <p>You can return back to your manager in case you didn't get understanding of any point.</p>

                <div className="policy-actions">
                    <a
                        href={POLICY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-create"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
                    >
                        📄 Open Policy Document
                    </a>
                </div>
            </div>
        </div>
    )
}
