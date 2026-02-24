import { useMemo, useState } from 'react'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function App() {
	const [to, setTo] = useState('')
	const [subject, setSubject] = useState('')
	const [text, setText] = useState('')
	const [status, setStatus] = useState({ type: 'idle', message: '' })
	const [isSending, setIsSending] = useState(false)

	const API_BASE = import.meta.env.VITE_API_URL // обязателен в проде

	const canSend = useMemo(() => {
		return (
			emailRegex.test(to.trim()) &&
			subject.trim().length > 0 &&
			text.trim().length > 0 &&
			!isSending
		)
	}, [to, subject, text, isSending])

	async function handleSubmit(e) {
		e.preventDefault()
		if (!canSend) return

		if (!API_BASE) {
			setStatus({
				type: 'error',
				message: '❌ Не задан VITE_API_URL (Render Environment)',
			})
			return
		}

		setIsSending(true)
		setStatus({ type: 'loading', message: 'Отправляю...' })

		try {
			const res = await fetch(`${API_BASE}/api/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					to: to.trim(),
					subject: subject.trim(),
					text: text.trim(),
				}),
			})

			const contentType = res.headers.get('content-type') || ''
			const payload = contentType.includes('application/json')
				? await res.json().catch(() => ({}))
				: await res.text().catch(() => '')

			if (!res.ok) {
				setStatus({
					type: 'error',
					message:
						typeof payload === 'string'
							? payload || `Ошибка ${res.status}`
							: JSON.stringify(payload),
				})
				return
			}

			setStatus({
				type: 'success',
				message: `✅ Отправлено${payload?.id ? ` (id: ${payload.id})` : ''}`,
			})

			setTo('')
			setSubject('')
			setText('')
		} catch {
			setStatus({
				type: 'error',
				message: '❌ Не удалось отправить (сервер/сеть)',
			})
		} finally {
			setIsSending(false)
		}
	}

	return (
		<div className='page'>
			<div className='card'>
				<h1 className='title'>Email отправка</h1>
				<p className='subtitle'>Frontend (Static) → Backend (Node) → Resend</p>

				<form onSubmit={handleSubmit} className='form'>
					<label className='field'>
						<span className='label'>Кому (email)</span>
						<input
							className='input'
							value={to}
							onChange={e => setTo(e.target.value)}
							placeholder='test@example.com'
							autoComplete='email'
						/>
						{to.length > 0 && !emailRegex.test(to.trim()) && (
							<span className='hint error'>Введите корректный email</span>
						)}
					</label>

					<label className='field'>
						<span className='label'>Тема</span>
						<input
							className='input'
							value={subject}
							onChange={e => setSubject(e.target.value)}
							placeholder='Например: Заявка с сайта'
							maxLength={120}
						/>
					</label>

					<label className='field'>
						<span className='label'>Сообщение</span>
						<textarea
							className='textarea'
							value={text}
							onChange={e => setText(e.target.value)}
							placeholder='Введите текст...'
							rows={7}
							maxLength={5000}
						/>
						<span className='hint'>{text.length}/5000</span>
					</label>

					<button className='btn' type='submit' disabled={!canSend}>
						{isSending ? 'Отправка...' : 'Отправить'}
					</button>

					{status.type !== 'idle' && (
						<div
							className={[
								'status',
								status.type === 'success' ? 'status-ok' : '',
								status.type === 'error' ? 'status-bad' : '',
								status.type === 'loading' ? 'status-warn' : '',
							].join(' ')}
						>
							{status.message}
						</div>
					)}
				</form>

				<div className='footer'>
					<code className='code'>
						API: {API_BASE || '(VITE_API_URL не задан)'}
					</code>
				</div>
			</div>
		</div>
	)
}
