import { useState } from 'react';
import { PLACE_LABELS } from '../data/constants';

export default function QuestionTab({
  t,
  lang,
  pastorMode,
  setPastorMode,
  questionDraft,
  setQuestionDraft,
  myQuestion,
  setMyQuestion,
  submitQuestion,
  pastorQueue,
  assigningId,
  setAssigningId,
  assignPlace,
  setAssignPlace,
  assignTime,
  setAssignTime,
  assignPastorName,
  setAssignPastorName,
  confirmAssign
}) {
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const modeParticipantBg = !pastorMode ? '#fff' : 'transparent';
  const modeParticipantFg = !pastorMode ? '#0E1B38' : 'rgba(18,23,42,0.5)';
  const modePastorBg = pastorMode ? '#fff' : 'transparent';
  const modePastorFg = pastorMode ? '#0E1B38' : 'rgba(18,23,42,0.5)';

  const canSubmitQuestion = Boolean(questionDraft.trim() && consent && !submitting);
  const questionSubmitBg = canSubmitQuestion ? '#0E1B38' : 'rgba(18,23,42,0.15)';
  const questionSubmitFg = canSubmitQuestion ? '#fff' : 'rgba(18,23,42,0.4)';

  const handleSubmitQuestion = async () => {
    if (!canSubmitQuestion) return;
    setSubmitting(true);
    const sent = await submitQuestion(true);
    if (sent) setConsent(false);
    setSubmitting(false);
  };

  return (
    <>
      <div style={{
        display: 'flex',
        background: 'rgba(18,23,42,0.06)',
        borderRadius: '100px',
        padding: '4px',
        marginBottom: '18px'
      }}>
        <button
          type="button"
          className="ui-button-reset"
          onClick={() => setPastorMode(false)}
          aria-pressed={!pastorMode}
          style={{
          flex: 1,
          textAlign: 'center',
          padding: '10px',
          borderRadius: '100px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          background: modeParticipantBg,
          color: modeParticipantFg
        }}>{t('question_mode_participant')}</button>

        <button
          type="button"
          className="ui-button-reset"
          onClick={() => setPastorMode(true)}
          aria-pressed={pastorMode}
          style={{
          flex: 1,
          textAlign: 'center',
          padding: '10px',
          borderRadius: '100px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          background: modePastorBg,
          color: modePastorFg
        }}>{t('question_mode_pastor')}</button>
      </div>

      {/* Participant mode */}
      {!pastorMode && (
        <>
          {!myQuestion && (
            <>
              <label htmlFor="participant-question" style={{
                display: 'block',
                fontFamily: "'Anton', sans-serif",
                fontSize: '19px',
                color: '#12172A',
                textTransform: 'uppercase'
              }}>{t('question_intro_title')}</label>

              <div style={{
                fontSize: '13.5px',
                color: 'rgba(18,23,42,0.65)',
                marginTop: '8px',
                lineHeight: '1.5'
              }}>{t('question_intro_body')}</div>

              <textarea
                id="participant-question"
                name="question"
                value={questionDraft}
                onChange={(e) => setQuestionDraft(e.target.value)}
                placeholder={t('question_placeholder')}
                maxLength={2000}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  border: '1px solid rgba(18,23,42,0.15)',
                  borderRadius: '14px',
                  padding: '14px',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '14px',
                  color: '#12172A',
                  boxSizing: 'border-box',
                  resize: 'none',
                  marginTop: '16px'
                }}
              />

              <label htmlFor="question-consent" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginTop: '12px',
                color: 'rgba(18,23,42,0.72)',
                fontSize: '12.5px',
                lineHeight: 1.45,
              }}>
                <input
                  id="question-consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  disabled={submitting}
                  style={{ marginTop: '3px', flex: 'none' }}
                />
                <span>{t('question_consent')}</span>
              </label>

              <button
                type="button"
                className="ui-button-reset"
                onClick={handleSubmitQuestion}
                disabled={!canSubmitQuestion}
                aria-busy={submitting}
                style={{
                marginTop: '12px',
                background: questionSubmitBg,
                color: questionSubmitFg,
                fontWeight: 700,
                textAlign: 'center',
                padding: '15px',
                borderRadius: '100px',
                cursor: canSubmitQuestion ? 'pointer' : 'not-allowed',
                width: '100%'
              }}>{submitting ? t('question_submitting') : t('question_submit')}</button>
            </>
          )}

          {myQuestion && myQuestion.status === 'pending' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#FDF6D8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c79a00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9"></circle>
                    <polyline points="12 7 12 12 15.5 14"></polyline>
                  </svg>
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Anton', sans-serif",
                    fontSize: '17px',
                    color: '#12172A',
                    textTransform: 'uppercase'
                  }}>{t('question_pending_title')}</div>
                  <div style={{
                    display: 'inline-block',
                    marginTop: '4px',
                    background: '#F2E94E',
                    color: '#12172A',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: '100px'
                  }}>{t('question_pending_chip')}</div>
                </div>
              </div>

              <div style={{
                fontSize: '13.5px',
                color: 'rgba(18,23,42,0.65)',
                marginTop: '14px',
                lineHeight: '1.5'
              }}>{t('question_pending_body')}</div>

              <div style={{
                marginTop: '16px',
                background: '#fff',
                border: '1px solid rgba(18,23,42,0.08)',
                borderRadius: '14px',
                padding: '14px'
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'rgba(18,23,42,0.45)',
                  textTransform: 'uppercase'
                }}>{t('question_your_label')}</div>
                <div style={{
                  fontSize: '13.5px',
                  color: '#12172A',
                  marginTop: '5px',
                  lineHeight: '1.4'
                }}>{myQuestion.text}</div>
              </div>
            </>
          )}

          {myQuestion && myQuestion.status === 'assigned' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#E3F7EE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2FBF8F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Anton', sans-serif",
                    fontSize: '17px',
                    color: '#12172A',
                    textTransform: 'uppercase'
                  }}>{t('question_assigned_title')}</div>
                  <div style={{
                    display: 'inline-block',
                    marginTop: '4px',
                    background: '#2FBF8F',
                    color: '#fff',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: '100px'
                  }}>{t('question_assigned_chip')}</div>
                </div>
              </div>

              <div style={{
                marginTop: '16px',
                background: '#fff',
                border: '1px solid rgba(18,23,42,0.08)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'rgba(18,23,42,0.45)',
                    textTransform: 'uppercase'
                  }}>{t('question_pastor_label')}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#12172A',
                    marginTop: '3px',
                    fontWeight: 600
                  }}>{myQuestion.pastor}</div>
                </div>

                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'rgba(18,23,42,0.45)',
                    textTransform: 'uppercase'
                  }}>{t('question_place_label')}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#12172A',
                    marginTop: '3px'
                  }}>{myQuestion.place}</div>
                </div>

                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'rgba(18,23,42,0.45)',
                    textTransform: 'uppercase'
                  }}>{t('question_time_label')}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#12172A',
                    marginTop: '3px'
                  }}>{myQuestion.time}</div>
                </div>
              </div>

              <button
                type="button"
                className="ui-button-reset"
                onClick={() => setMyQuestion(null)}
                style={{
                marginTop: '14px',
                textAlign: 'center',
                color: 'rgba(18,23,42,0.5)',
                fontSize: '13px',
                fontWeight: 600,
                padding: '10px',
                cursor: 'pointer',
                width: '100%'
              }}>{t('question_ask_new')}</button>
            </>
          )}
        </>
      )}

      {/* Pastor mode */}
      {pastorMode && (
        <>
          <div style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: '18px',
            color: '#12172A',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>{t('pastor_dashboard_title')}</div>

          {pastorQueue.map(q => {
            const isNew = q.status === 'pending';
            const isAssigned = q.status === 'assigned';
            const showForm = assigningId === q.id;

            return (
              <div key={q.id} style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '14px',
                marginBottom: '12px',
                border: '1px solid rgba(18,23,42,0.06)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'rgba(18,23,42,0.5)'
                  }}>{q.participant}</div>
                  {isNew && (
                    <div style={{
                      background: '#F2E94E',
                      color: '#12172A',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '100px',
                      flex: 'none'
                    }}>{t('pastor_new_chip')}</div>
                  )}
                </div>

                <div style={{
                  fontSize: '13.5px',
                  color: '#12172A',
                  marginTop: '8px',
                  lineHeight: '1.4'
                }}>{q.text}</div>

                {isNew && !showForm && (
                  <button
                    type="button"
                    className="ui-button-reset"
                    onClick={() => setAssigningId(q.id)}
                    aria-expanded={showForm}
                    aria-controls={`assignment-form-${q.id}`}
                    style={{
                    marginTop: '12px',
                    display: 'inline-block',
                    background: '#0E1B38',
                    color: '#fff',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    padding: '9px 16px',
                    borderRadius: '100px',
                    cursor: 'pointer'
                  }}>{t('pastor_assign_btn')}</button>
                )}

                {isAssigned && (
                  <div style={{
                    marginTop: '10px',
                    background: '#F3FAF6',
                    borderRadius: '10px',
                    padding: '10px 12px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#0E1B38' }}>
                      <strong>{t('pastor_assigned_to')}:</strong> {q.pastor}
                    </div>
                    <div style={{
                      fontSize: '11.5px',
                      color: 'rgba(18,23,42,0.6)',
                      marginTop: '3px'
                    }}>
                      {q.place} · {q.time}
                    </div>
                  </div>
                )}

                {showForm && (
                  <div id={`assignment-form-${q.id}`} style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(18,23,42,0.08)'
                  }}>
                    <label htmlFor={`assignment-place-${q.id}`} style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'rgba(18,23,42,0.5)',
                      textTransform: 'uppercase',
                      marginBottom: '4px'
                    }}>{t('pastor_form_place_label')}</label>
                    <select
                      id={`assignment-place-${q.id}`}
                      name="assignmentPlace"
                      value={assignPlace}
                      onChange={(e) => setAssignPlace(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid rgba(18,23,42,0.15)',
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '13px',
                        marginBottom: '10px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">Sélectionner un lieu</option>
                      <option value="roomA">{PLACE_LABELS.roomA[lang]}</option>
                      <option value="roomB">{PLACE_LABELS.roomB[lang]}</option>
                      <option value="office">{PLACE_LABELS.office[lang]}</option>
                    </select>

                    <label htmlFor={`assignment-time-${q.id}`} style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'rgba(18,23,42,0.5)',
                      textTransform: 'uppercase',
                      marginBottom: '4px'
                    }}>{t('pastor_form_time_label')}</label>
                    <select
                      id={`assignment-time-${q.id}`}
                      name="assignmentTime"
                      value={assignTime}
                      onChange={(e) => setAssignTime(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid rgba(18,23,42,0.15)',
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '13px',
                        marginBottom: '10px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">Sélectionner un horaire</option>
                      <option value="17h30 – 17h50">17h30 – 17h50</option>
                      <option value="17h50 – 18h10">17h50 – 18h10</option>
                      <option value="18h10 – 18h30">18h10 – 18h30</option>
                      <option value="18h30 – 18h50">18h30 – 18h50</option>
                    </select>

                    <label htmlFor={`assignment-pastor-${q.id}`} style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'rgba(18,23,42,0.5)',
                      textTransform: 'uppercase',
                      marginBottom: '4px'
                    }}>{t('pastor_form_name_label')}</label>
                    <input
                      id={`assignment-pastor-${q.id}`}
                      name="pastorName"
                      value={assignPastorName}
                      onChange={(e) => setAssignPastorName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid rgba(18,23,42,0.15)',
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '13px',
                        marginBottom: '12px',
                        boxSizing: 'border-box'
                      }}
                    />

                    <button
                      type="button"
                      className="ui-button-reset"
                      onClick={confirmAssign}
                      aria-disabled={!(assignPlace && assignTime && assignPastorName.trim())}
                      style={{
                      background: '#EA4630',
                      color: '#fff',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '13.5px',
                      padding: '12px',
                      borderRadius: '100px',
                      cursor: 'pointer',
                      width: '100%'
                    }}>{t('pastor_confirm_btn')}</button>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
