import { useEffect, useState, type FormEvent } from 'react'
import { Button, Form } from 'react-bootstrap'
import { createHeatingDraft, deleteHeatingEquipment, loadHeatingDraft, publishHeatingEquipment } from '../state/equipment'
import { useAppDispatch, useAppSelector } from '../state/store'

export function AddEquipment({ onPublished }: { onPublished: () => void }) {
  const dispatch = useAppDispatch()
  const { draft, draftChecked, pending } = useAppSelector(state => state.heatingEquipment)
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [power, setPower] = useState('')
  const [cost, setCost] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [video, setVideo] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => { void dispatch(loadHeatingDraft()) }, [dispatch])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  function chooseImage(file: File | null) {
    setImage(file)
    setPreview(file ? URL.createObjectURL(file) : '')
    setFormError('')
  }

  function goToDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || !image || !video) {
      setFormError('Укажи название, выбери изображение и видео прибора.')
      return
    }
    setFormError('')
    setStep(2)
  }

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || !image || !video) {
      setStep(1)
      setFormError('Сначала выбери изображение и видео прибора.')
      return
    }
    const numericPower = Number(power)
    const numericCost = Number(cost)
    if (!Number.isFinite(numericPower) || numericPower <= 0 ||
      !Number.isFinite(numericCost) || numericCost <= 0) {
      setFormError('Укажи положительные значения мощности и стоимости.')
      return
    }
    setFormError('')
    const result = await dispatch(createHeatingDraft({
      name: name.trim(), description: description.trim(), power: numericPower,
      cost: numericCost, image, video,
    }))
    if (createHeatingDraft.fulfilled.match(result)) {
      chooseImage(null)
      setVideo(null)
      setStep(1)
    } else if (result.payload?.includes('уже есть черновик')) {
      void dispatch(loadHeatingDraft())
    }
  }

  return <section className="form-page equipment-add-page">
    <h1>Добавление прибора</h1>
    {!draftChecked ? !pending && <Button onClick={() => void dispatch(loadHeatingDraft())}>Проверить черновик</Button> :
      draft ? <div className="draft-preview">
        <h2>Твой черновик</h2>
        {draft.image_url && <img src={draft.image_url} alt={draft.name} />}
        <h3>{draft.name}</h3><p>{draft.description}</p>
        <p>{draft.power} кВт · {draft.cost.toLocaleString('ru-RU')} ₽</p>
        <Button onClick={async () => {
          const result = await dispatch(publishHeatingEquipment(draft.id))
          if (publishHeatingEquipment.fulfilled.match(result)) onPublished()
        }}>Опубликовать</Button>
        <Button variant="outline-secondary" onClick={() => {
          if (window.confirm('Удалить этот черновик?')) void dispatch(deleteHeatingEquipment(draft.id))
        }}>Удалить черновик</Button>
      </div> : <>
        <p className="form-step-indicator">Шаг {step} из 2 · {step === 1 ? 'Название и файлы' : 'Характеристики'}</p>
        {formError && <p className="form-validation" role="alert">{formError}</p>}
        {step === 1 ? <Form className="equipment-form" onSubmit={goToDetails}>
          <div className="equipment-form-panel">
            <h2>Основная информация</h2>
            <Form.Group controlId="equipmentName">
              <Form.Label>Название отопительного прибора</Form.Label>
              <Form.Control required value={name} onChange={event => setName(event.target.value)}
                maxLength={120} pattern=".*\S.*" placeholder="Например, дровяная печь «Уют»" />
            </Form.Group>
          </div>
          <div className="equipment-form-panel">
            <h2>Загрузка медиа</h2>
            <Form.Group>
              <Form.Label htmlFor="equipmentImage">Изображение</Form.Label>
              <Form.Control id="equipmentImage" type="file" accept="image/*" className="visually-hidden"
                onChange={event => chooseImage((event.currentTarget as HTMLInputElement).files?.[0] ?? null)} />
              <label className="btn btn-outline-primary file-select-button" htmlFor="equipmentImage">Выбрать изображение</label>
              <span className="chosen-file" aria-live="polite">{image ? image.name : 'Файл не выбран'}</span>
              {preview && <img className="file-preview" src={preview} alt="Предварительный просмотр выбранного изображения" />}
            </Form.Group>
            <Form.Group>
              <Form.Label htmlFor="equipmentVideo">Видео</Form.Label>
              <Form.Control id="equipmentVideo" type="file" accept="video/*" className="visually-hidden"
                onChange={event => { setVideo((event.currentTarget as HTMLInputElement).files?.[0] ?? null); setFormError('') }} />
              <label className="btn btn-outline-primary file-select-button" htmlFor="equipmentVideo">Выбрать видео</label>
              <span className="chosen-file" aria-live="polite">{video ? video.name : 'Файл не выбран'}</span>
            </Form.Group>
          </div>
          <Button type="submit" className="form-next-button">Далее</Button>
        </Form> : <Form className="equipment-form" onSubmit={event => void createDraft(event)}>
          <div className="equipment-form-panel">
            <h2>Характеристики прибора</h2>
            <p className="equipment-form-note">Название, изображение и видео уже выбраны. Осталось указать характеристики, необходимые для создания карточки.</p>
            <Form.Group controlId="description"><Form.Label>Описание</Form.Label>
              <Form.Control as="textarea" rows={3} name="description" value={description}
                onChange={event => setDescription(event.target.value)} maxLength={500} /></Form.Group>
            <Form.Group controlId="power"><Form.Label>Мощность, кВт</Form.Label>
              <Form.Control type="number" min="0.000001" step="any" required name="power" value={power}
                onChange={event => setPower(event.target.value)} /></Form.Group>
            <Form.Group controlId="cost"><Form.Label>Стоимость, ₽</Form.Label>
              <Form.Control type="number" min="0.01" step="0.01" required name="cost" value={cost}
                onChange={event => setCost(event.target.value)} /></Form.Group>
          </div>
          <div className="form-step-actions">
            <Button variant="outline-secondary" type="button" onClick={() => { setFormError(''); setStep(1) }}>Назад</Button>
            <Button type="submit">Создать черновик</Button>
          </div>
          <p className="equipment-form-note">После создания черновика его можно опубликовать или удалить.</p>
        </Form>}
      </>}
  </section>
}
