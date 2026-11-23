import { useEffect, useState } from 'react'
import { Button, Container, Form, Pagination } from 'react-bootstrap'
import { TileCard, TileImage } from '../components/EquipmentCards'
import { deleteHeatingEquipment, equipmentPageSize, loadHeatingTiles } from '../state/equipment'
import { applyPower, editPower, setPage, setSort } from '../state/session'
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
  const { input, minPower, page, sort } = useAppSelector(state => state.equipmentFilters)
  const { tiles, total, error, pending } = useAppSelector(state => state.heatingEquipment)
  useEffect(() => {
    const request = dispatch(loadHeatingTiles({ power: minPower, page, sort }))
    return () => request.abort()
  }, [dispatch, minPower, page, sort, login])
  const totalPages = Math.max(1, Math.ceil(total / equipmentPageSize))
  const changePage = (next: number) => {
    dispatch(setPage(next))
    document.querySelector('.phone-content')?.scrollTo({ top: 0 })
  }
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
      if (input === minPower && page === 1) void dispatch(loadHeatingTiles({ power: minPower, page, sort }))
      else dispatch(applyPower())
    }}>
      <div className="filter-main-row">
        <Form.Control aria-label="Мин. мощность, кВт" type="number" min="0" step="any" placeholder="Мин. мощность, кВт"
          value={input} onChange={event => dispatch(editPower(event.target.value))} />
        <Button type="submit">Найти</Button>
      </div>
      <Form.Select aria-label="Сортировка" value={sort} onChange={event => dispatch(setSort(event.target.value === 'power' ? 'power' : event.target.value === 'price' ? 'price' : 'new'))}>
        <option value="new">Сначала новые</option><option value="price">По возрастанию цены</option>
        <option value="power">По возрастанию мощности</option>
      </Form.Select>
    </Form>
    <p className="found">{!error && !pending && !tiles.length ? 'По этому фильтру приборов нет.' : `Найдено приборов: ${total}`}</p>
    {(totalPages > 1 || page > 1) && <nav aria-label="Страницы каталога" className="d-flex justify-content-center">
      <Pagination size="sm">
        <Pagination.First onClick={() => changePage(1)} disabled={page <= 1} />
        <Pagination.Prev onClick={() => changePage(page - 1)} disabled={page <= 1} />
        <Pagination.Item active>{page} / {totalPages}</Pagination.Item>
        <Pagination.Next onClick={() => changePage(page + 1)} disabled={page >= totalPages} />
        <Pagination.Last onClick={() => changePage(totalPages)} disabled={page >= totalPages} />
      </Pagination>
    </nav>}
    <div className="equipment-grid">{tiles.map(item => <div key={item.id}>
      <TileCard service={item} onDetails={() => {
        history.pushState({ fromTiles: true }, '', '#equipment-' + item.id)
        setDetailId(item.id)
      }} onDelete={login && item.is_creator === 1 ? () => {
        if (window.confirm(`Удалить «${item.name}»?`)) {
          void dispatch(deleteHeatingEquipment(item.id)).unwrap().then(() => {
            if (page > 1 && tiles.length === 1) changePage(page - 1)
            else void dispatch(loadHeatingTiles({ power: minPower, page, sort }))
          }).catch(() => {})
        }
      } : undefined} />
    </div>)}</div>
  </Container>
}
