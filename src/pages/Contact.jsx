import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { Field, PageHead, focusFirstBad } from '../components/ui';
import { isEmail } from '../lib/util';
import { explain, sendMessage } from '../lib/api';
import { TOPICS } from '../data/constants';
import { useAuth } from '../context/AuthContext';
import { usePageReady, useTitle } from '../context/PageTransition';
const FAQ = [
  ['How long does delivery take?', 'Orders placed before 2pm ship the same day and arrive in 2 to 4 days. Express reaches metro cities the next day for ₹299.'],
  ['What does delivery cost?', 'Free on orders over ₹4,999. Below that, standard delivery is ₹149.'],
  ['Which size should I order?', 'All sizes on the site are UK. Take your usual size in most pairs. If you are between sizes or have wide feet, go half a size up, or message us with a shoe that fits you well and we will match it.'],
  ['Can I return a pair?', 'Yes, within 7 days of delivery, as long as the pair is unworn and in its original box. We arrange and pay for the pickup, and refund to your original payment method.'],
  ['How do I know the shoes are real?', 'Every pair is opened and inspected by hand before it ships: stitching, materials, box label and both shoes. If a pair fails, it never reaches the shelf.'],
];

function ContactForm() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const order = params.get('order') || '';
  const [v, setV] = useState({
    name: (user && user.name) || '',
    email: (user && user.email) || '',
    topic: order ? 'An order' : TOPICS[0],
    order,
    message: '',
  });
  const [bad, setBad] = useState({});
  const [sent, setSent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef(null);
  const sentRef = useRef(null);

  useEffect(() => { if (sent && sentRef.current) sentRef.current.focus(); }, [sent]);

  const set = (name) => (e) => {
    setV((s) => ({ ...s, [name]: e.target.value }));
    setBad((b) => ({ ...b, [name]: false }));
  };

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const nextBad = { name: v.name.trim().length < 2, email: !isEmail(v.email), message: v.message.trim().length < 10 };
    setBad(nextBad);
    if (Object.values(nextBad).some(Boolean)) {
      requestAnimationFrame(() => focusFirstBad(formRef.current));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await sendMessage(v);
      setSent({ first: v.name.trim().split(' ')[0], email: v.email.trim() });
    } catch (err) {
      setError(explain(err));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="sent" role="status" tabIndex={-1} ref={sentRef}>
        <h2>Message sent</h2>
        <p>Thanks, {sent.first}. We reply within one working day, to {sent.email}.</p>
      </div>
    );
  }

  return (
    <form className="form" id="contactForm" noValidate ref={formRef} onSubmit={submit}>
      <div className="form__row">
        <Field name="name" label="Your name" error="Enter your name so we know who to reply to." bad={bad.name} autoComplete="name" value={v.name} onChange={set('name')} />
        <Field name="email" label="Email" error="Enter an email like you@example.com." bad={bad.email} type="email" autoComplete="email" value={v.email} onChange={set('email')} />
      </div>
      <div className="form__row">
        <Field name="topic" label="What is it about?" as="select" value={v.topic} onChange={set('topic')}>
          {TOPICS.map((t) => <option key={t}>{t}</option>)}
        </Field>
        <Field name="order" label="Order number, if you have one" placeholder="RL-00000" autoComplete="off" value={v.order} onChange={set('order')} />
      </div>
      <Field name="message" label="Message" as="textarea" rows={6} error="Tell us a little more, at least a sentence." bad={bad.message} value={v.message} onChange={set('message')} />
      {error && <p className="form-error" role="alert" style={{ margin: 0 }}>{error}</p>}
      <div><button className="btn btn--red" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button></div>
    </form>
  );
}

export default function Contact() {
  usePageReady();
  useTitle('Contact us — Redlace');
  return (
    <div className="wrap">
      <PageHead title="Talk to us" note="We reply within one working day." />
      <div className="contact">
        <ContactForm />
        <div className="contact__ways">
          <div><h3>Email</h3><a href="mailto:hello@redlace.example">hello@redlace.example</a></div>
          <div><h3>Phone and WhatsApp</h3><p>+91 80 5550 0142<small>Monday to Saturday, 10am to 7pm</small></p></div>
          <div><h3>Studio</h3><p>12th Main Road, Indiranagar<small>Bengaluru 560038. Try-ons by appointment.</small></p></div>
        </div>
      </div>

      <section className="sec" id="faq" style={{ paddingBottom: 0 }} aria-labelledby="faqH">
        <div className="sec-head"><Reveal className="d h-lg" id="faqH">Asked most often</Reveal></div>
        <div className="acc" style={{ marginTop: 0 }}>
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <div className="acc__body"><p>{a}</p></div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
