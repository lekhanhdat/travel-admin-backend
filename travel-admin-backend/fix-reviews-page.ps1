$content = @'
import React, { useEffect, useState, useCallback } from 'react';
import { Table, Card, Row, Col, Statistic, Input, Select, Space, Tag, Rate, Avatar, Button } from 'antd';
import { StarOutlined, EnvironmentOutlined, CalendarOutlined, SearchOutlined, ClearOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { Review, ReviewStats, FilterOption } from '../types';
import { reviewsService } from '../services/reviews';

const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<number | undefined>(undefined);
  const [festivalFilter, setFestivalFilter] = useState<number | undefined>(undefined);
  const [locations, setLocations] = useState<FilterOption[]>([]);
  const [festivals, setFestivals] = useState<FilterOption[]>([]);

  const fetchStats = useCallback(async () => { try { const data = await reviewsService.getStats(); setStats(data); } catch (error) { console.error('Failed to load stats', error); } }, []);
  const fetchFilters = useCallback(async () => { try { const data = await reviewsService.getFilterOptions(); setLocations(data.locations || []); setFestivals(data.festivals || []); } catch (error) { console.error('Failed to load filters', error); } }, []);

  const fetchReviews = useCallback(async (params: { page?: number; limit?: number; search?: string; locationId?: number; festivalId?: number } = {}) => {
    try {
      setLoading(true);
      const locId = params.locationId !== undefined ? params.locationId : locationFilter;
      const festId = params.festivalId !== undefined ? params.festivalId : festivalFilter;
      const result = await reviewsService.getAll({
        page: params.page || pagination.current,
        limit: params.limit || pagination.pageSize,
        search: params.search !== undefined ? params.search : search,
        locationId: locId !== undefined ? String(locId) : undefined,
        festivalId: festId !== undefined ? String(festId) : undefined,
      });
      setReviews(result.list || []);
      setPagination(prev => ({ ...prev, current: result.pageInfo?.page || 1, total: result.pageInfo?.totalRows || 0 }));
    } catch (error) { console.error('Failed to load reviews', error); }
    finally { setLoading(false); }
  }, [pagination.current, pagination.pageSize, search, locationFilter, festivalFilter]);

  useEffect(() => { fetchStats(); fetchFilters(); fetchReviews({ page: 1 }); }, []);

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    setPagination(prev => ({ ...prev, current: paginationConfig.current || 1, pageSize: paginationConfig.pageSize || 10 }));
    fetchReviews({ page: paginationConfig.current, limit: paginationConfig.pageSize });
  };

  const handleSearch = () => fetchReviews({ page: 1, search });
  const handleLocationChange = (value: number | undefined) => { setLocationFilter(value); setFestivalFilter(undefined); fetchReviews({ page: 1, locationId: value, festivalId: undefined }); };
  const handleFestivalChange = (value: number | undefined) => { setFestivalFilter(value); setLocationFilter(undefined); fetchReviews({ page: 1, festivalId: value, locationId: undefined }); };
  const handleClearFilters = () => { setSearch(''); setLocationFilter(undefined); setFestivalFilter(undefined); fetchReviews({ page: 1, search: '', locationId: undefined, festivalId: undefined }); };

  const columns: ColumnsType<Review> = [
    { title: '#', key: 'rowNumber', width: 50, render: (_: unknown, __: Review, index: number) => (pagination.current - 1) * pagination.pageSize + index + 1 },
    { title: 'Source', dataIndex: 'source', key: 'source', width: 100, render: (source: string) => (<Tag color={source === 'Location' ? 'blue' : 'green'} icon={source === 'Location' ? <EnvironmentOutlined /> : <CalendarOutlined />}>{source}</Tag>) },
    { title: 'Source Name', dataIndex: 'sourceName', key: 'sourceName', width: 180 },
    { title: 'User', dataIndex: 'user', key: 'user', width: 150, render: (user: string) => (<Space><Avatar size="small">{user?.charAt(0)?.toUpperCase()}</Avatar><span>{user || 'Anonymous'}</span></Space>) },
    { title: 'Rating', dataIndex: 'rating', key: 'rating', width: 120, render: (rating: number) => <Rate disabled value={rating} style={{ fontSize: 14 }} /> },
    { title: 'Comment', dataIndex: 'comment', key: 'comment', render: (text: string) => <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text || '-'}</div> },
    { title: 'Time', dataIndex: 'timeReview', key: 'timeReview', width: 140, render: (time: string) => time ? (<Space size="small"><ClockCircleOutlined style={{ color: '#8c8c8c' }} /><span style={{ color: '#8c8c8c', fontSize: 12 }}>{time}</span></Space>) : '-' },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Reviews</h1>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="Total Reviews" value={stats?.totalReviews || 0} prefix={<StarOutlined />} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="Location Reviews" value={stats?.locationReviews || 0} prefix={<EnvironmentOutlined style={{ color: '#1890ff' }} />} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="Festival Reviews" value={stats?.festivalReviews || 0} prefix={<CalendarOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="Average Rating" value={stats?.averageRating || 0} precision={1} prefix={<StarOutlined style={{ color: '#faad14' }} />} valueStyle={{ color: '#faad14' }} suffix="/ 5" /></Card></Col>
      </Row>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}><Input placeholder="Search by user or comment..." value={search} onChange={(e) => setSearch(e.target.value)} onPressEnter={handleSearch} prefix={<SearchOutlined />} allowClear /></Col>
          <Col xs={24} sm={12} md={6}><Select placeholder="Filter by Location" value={locationFilter} onChange={handleLocationChange} allowClear style={{ width: '100%' }} options={locations.map(l => ({ label: l.name, value: l.id }))} showSearch optionFilterProp="label" /></Col>
          <Col xs={24} sm={12} md={6}><Select placeholder="Filter by Festival" value={festivalFilter} onChange={handleFestivalChange} allowClear style={{ width: '100%' }} options={festivals.map(f => ({ label: f.name, value: f.id }))} showSearch optionFilterProp="label" /></Col>
          <Col xs={24} sm={12} md={6}><Space><Button onClick={handleSearch}>Search</Button><Button icon={<ClearOutlined />} onClick={handleClearFilters}>Clear</Button></Space></Col>
        </Row>
      </Card>
      <Table columns={columns} dataSource={reviews} rowKey="id" loading={loading} pagination={{ ...pagination, showSizeChanger: true, showTotal: (total) => `Total ${total} reviews` }} onChange={handleTableChange} scroll={{ x: 1000 }} size="middle" />
    </div>
  );
};

export default ReviewsPage;
'@
$content | Out-File -FilePath "C:\Users\lekha\Desktop\travel-admin-frontend\src\pages\ReviewsPage.tsx" -Encoding UTF8 -Force
Write-Host "ReviewsPage.tsx updated successfully"

