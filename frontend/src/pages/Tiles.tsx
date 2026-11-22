import { useEffect, useState } from 'react'
import { Button, Container, Form } from 'react-bootstrap'
import { TileCard, TileImage } from '../components/EquipmentCards'
import { deleteHeatingEquipment, loadHeatingTiles } from '../state/equipment'
import { applyPower, editPower, setSort } from '../state/session'
import { useAppDispatch, useAppSelector } from '../state/store'

export function Tiles() {
  const [detailId, setDetailId] = useState<number | null>(null)
  useEffect(() => {
    const syncDetail = () => {
      const match = /^#equipment-(\d+)$/.exec(window.location.hash)
      setDetailId(match ? Number(match[1]) : null)
    }
    syncDetail()
    window.addEventListener('hashchange', syncDetail)
    return () => window.removeEventListener('hashchange', syncDetail)
  }, [])
  const dispatch = useAppDispatch()
  const login = useAppSelector(state => state.auth.login)
  const { input, minPower, sort } = useAppSelector(state => state.equipmentFilters)
  const { tiles, error, pending } = useAppSelector(state => state.heatingEquipment)
  useEffect(() => {
    const request = dispatch(loadHeatingTiles(minPower))
    return () => request.abort()
  }, [dispatch, minPower, login])
  const sorted = [...tiles].sort((a, b) => sort === 'price' ? a.cost - b.cost : b.id - a.id)
  const selected = tiles.find(item => item.id === detailId)
  if (selected) return <Container className="equipment-detail form-page">
    <Button variant="outline-secondary" onClick={() => {
      if (history.state?.fromTiles) history.back()
      else { history.replaceState(null, '', location.pathname + location.search); setDetailId(null) }
    }}>← К плитке</Button>
    <h1>{selected.name}</h1>
    <TileImage key={selected.id} service={selected} />
    <p>{selected.description}</p>
    <b>{selected.power} кВт · {selected.cost.toLocaleString('ru-RU')} ₽</b>
  </Container>
  return <Container className="tiles-container">
    <h1 className="visually-hidden">Плитка приборов</h1>
    <Form className="filter-form" onSubmit={event => {
      event.preventDefault()
      if (input === minPower) void dispatch(loadHeatingTiles(minPower))
      else dispatch(applyPower())
    }}>
      <div className="filter-main-row">
        <Form.Control aria-label="Мин. мощность, кВт" type="number" min="0" step="any" placeholder="Мин. мощность, кВт"
          value={input} onChange={event => dispatch(editPower(event.target.value))} />
        <Button type="submit">Найти</Button>
      </div>
      <Form.Select aria-label="Сортировка" value={sort} onChange={event => dispatch(setSort(event.target.value === 'price' ? 'price' : 'new'))}>
        <option value="new">Сначала новые</option><option value="price">По возрастанию цены</option>
      </Form.Select>
    </Form>
    <p className="found">{!error && !pending && !tiles.length ? 'По этому фильтру приборов нет.' : `Найдено приборов: ${tiles.length}`}</p>
    <div className="equipment-grid">{sorted.map(item => <div key={item.id}>
      <TileCard service={item} onDetails={() => {
        history.pushState({ fromTiles: true }, '', '#equipment-' + item.id)
        setDetailId(item.id)
      }} onDelete={login && item.is_creator === 1 ? () => {
        if (window.confirm(`Удалить «${item.name}»?`)) void dispatch(deleteHeatingEquipment(item.id))
      } : undefined} />
    </div>)}</div>
  </Container>
}
