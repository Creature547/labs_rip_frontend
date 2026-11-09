import { useEffect } from 'react'
import { Button, Col, Container, Form, Row } from 'react-bootstrap'
import { TileCard } from '../components/EquipmentCards'
import { deleteHeatingEquipment, loadHeatingTiles } from '../state/equipment'
import { applyPower, editPower, setSort } from '../state/session'
import { useAppDispatch, useAppSelector } from '../state/store'

export function Tiles() {
  const dispatch = useAppDispatch()
  const login = useAppSelector(state => state.auth.login)
  const { input, minPower, sort } = useAppSelector(state => state.equipmentFilters)
  const { tiles, error, pending } = useAppSelector(state => state.heatingEquipment)
  useEffect(() => {
    const request = dispatch(loadHeatingTiles(minPower))
    return () => request.abort()
  }, [dispatch, minPower, login])
  const sorted = [...tiles].sort((a, b) => sort === 'price' ? a.cost - b.cost : b.id - a.id)
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
    <Row className="g-2">{sorted.map(item => <Col key={item.id} xs={6}>
      <TileCard service={item} onDelete={login && item.is_creator === 1 ? () => {
        if (window.confirm(`Удалить «${item.name}»?`)) void dispatch(deleteHeatingEquipment(item.id))
      } : undefined} />
    </Col>)}</Row>
  </Container>
}
