import { useMemo, useState } from 'react'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function App() {
	const [to, setTo] = useState('')
	const [subject, setSubject] = useState('')
	const [text, setText] = useState('')
	const [status, setStatus] = useState({ type: 'idle', message: '' })
	const [isSending, setIsSending] = useState(false)

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

		setIsSending(true)
		setStatus({ type: 'loading', message: 'Отправляю...' })

		try {
			const res = await fetch('/api/email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					to: to.trim(),
					subject: subject.trim(),
					text: text.trim(),
				}),
			})

			if (!res.ok) {
				const raw = await res.text()
				setStatus({
					type: 'error',
					message: raw || 'Ошибка при отправке',
				})
				setIsSending(false)
				return
			}

			const data = await res.json().catch(() => ({}))
			setStatus({
				type: 'success',
				message: `✅ Отправлено${data?.id ? ` (id: ${data.id})` : ''}`,
			})

			// очищаем форму
			setTo('')
			setSubject('')
			setText('')
		} catch (err) {
			setStatus({
				type: 'error',
				message: 'Не удалось отправить (проверьте сервер / сеть)',
			})
		} finally {
			setIsSending(false)
		}
	}

	return (
		<div className='page'>
			<div className='card'>
				<h1 className='title'>SMTP/API Email отправка</h1>
				<p className='subtitle'>Фронт → Node.js → Email-сервис</p>

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
					<code className='code'>POST /api/email</code>
				</div>
			</div>
		</div>
	)
}
