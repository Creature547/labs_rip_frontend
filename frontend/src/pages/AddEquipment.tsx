import { useEffect, useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { createHeatingDraft, deleteHeatingEquipment, loadHeatingDraft, publishHeatingEquipment } from '../state/equipment'
import { useAppDispatch, useAppSelector } from '../state/store'

export function AddEquipment({ onPublished }: { onPublished: () => void }) {
  const dispatch = useAppDispatch()
  const { draft, draftChecked, pending } = useAppSelector(state => state.heatingEquipment)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  useEffect(() => { void dispatch(loadHeatingDraft()) }, [dispatch])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  function chooseImage(file: File | null) {
    setImage(file)
    setPreview(file ? URL.createObjectURL(file) : '')
  }
  return <section className="form-page">
    <h1>Добавление прибора</h1>
    {!draftChecked ? !pending && <Button onClick={() => dispatch(loadHeatingDraft())}>Проверить черновик</Button> :
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
      </div> :
      <Form onSubmit={async event => {
        event.preventDefault()
        const fields = new FormData(event.currentTarget)
        const video = fields.get('video')
        if (!image || !(video instanceof File)) return
        const result = await dispatch(createHeatingDraft({
          name: String(fields.get('name')).trim(), description: String(fields.get('description')).trim(),
          power: Number(fields.get('power')), cost: Number(fields.get('cost')), image, video,
        }))
        if (createHeatingDraft.fulfilled.match(result)) chooseImage(null)
        else if (result.payload?.includes('уже есть черновик')) void dispatch(loadHeatingDraft())
      }}>
        <Form.Group controlId="equipmentName"><Form.Label>Название</Form.Label>
          <Form.Control required name="name" maxLength={120} pattern=".*\S.*" /></Form.Group>
        <Form.Group controlId="description"><Form.Label>Описание</Form.Label>
          <Form.Control as="textarea" rows={2} name="description" maxLength={500} /></Form.Group>
        <Form.Group controlId="power"><Form.Label>Мощность, кВт</Form.Label>
          <Form.Control type="number" min="0.000001" step="any" required name="power" /></Form.Group>
        <Form.Group controlId="cost"><Form.Label>Стоимость, ₽</Form.Label>
          <Form.Control type="number" min="0.01" step="0.01" required name="cost" /></Form.Group>
        <Form.Group controlId="image"><Form.Label>Фото прибора</Form.Label>
          <Form.Control type="file" accept="image/*" required name="image"
            onChange={e => chooseImage((e.target as HTMLInputElement).files?.[0] ?? null)} /></Form.Group>
        {preview && <img className="file-preview" src={preview} alt="Выбранное фото" />}
        <Form.Group controlId="video"><Form.Label>Видео прибора</Form.Label>
          <Form.Control type="file" accept="video/*" required name="video" /></Form.Group>
        <Button type="submit">Сохранить черновик</Button>
      </Form>}
  </section>
}
