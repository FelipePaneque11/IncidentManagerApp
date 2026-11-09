import type { Incident } from "../api/incidents";

type IncidentDetailsProps = {
    incident: Incident
    assigneeName: string
    slaLabel: string
    formatDate(value: string): string
    onClose(): void
    onEdit(): void
    onDelete(): void
    isDeleting: boolean
}

export default function IncidentDetails(props: IncidentDetailsProps){
    // a shorter name for the incident supplied by the dashboard
    const incident = props.incident

    return(
        <section className="incident-details" aria-labelledby="incident-details-heading">
            <div className="incident-details-heading">
                <h3 id="incident-details-heading">Incident details</h3>
                <div className="button-row">
                    <button type="button" onClick={props.onEdit} disabled={props.isDeleting}>Edit Incident</button>
                    <button type="button" onClick={props.onDelete} disabled={props.isDeleting} className="danger-button">
                        {props.isDeleting ? "Deleting" : "Delete incident"}
                    </button>
                    <button type="button"className="secondary-button" onClick={props.onClose} disabled={props.isDeleting}>Close</button>
                </div>
            </div>

            <h4>{incident.title}</h4>
            <p className="incident-description">{incident.description}</p>

            {/*a description list pairs each label with its value*/}
            <dl className="incident-details-grid">

                <div>
                    <dt>Incident ID</dt>
                    <dd>{props.incident.id}</dd>
                </div>

                <div>
                    {/* description term */}
                    <dt>Priority</dt>
                    {/* description */}
                    <dd>
                        <span className={'badge priority-' + incident.priority}>{incident.priority}</span>
                    </dd>
                </div>
            
                <div>
                    <dt>Status</dt>
                    <dd>{incident.status}</dd>
                </div>

                <div>
                    <dt>Assignee</dt>
                    <dd>{props.assigneeName}</dd>
                </div>

                <div>
                    <dt>Created At</dt>
                    <dd>{props.formatDate(incident.created_at)}</dd>
                </div>

                <div>
                    <dt>Deadline</dt>
                    <dd>{props.formatDate(incident.deadline)}</dd>
                </div>

                <div>
                    <dt>State</dt>
                    <dd>{props.slaLabel}</dd>
                </div>
            </dl>
        </section>
    )
}