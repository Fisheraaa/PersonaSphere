import { useState, useEffect, useRef } from 'react';
import { Modal, Typography, Button, message, Popconfirm, Space, Tooltip } from 'antd';
import { CloseOutlined, EditOutlined, CheckOutlined, DeleteOutlined, PlusOutlined, CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { Person, Event, Annotation, Development } from '../types';
import { updatePerson, deletePerson as deletePersonApi } from '../api';

const { Title, Text } = Typography;

const MORANDI_COLORS = ['#4A7B9C', '#9B6B6B', '#5F7256', '#B5A189', '#9251A8'];
const MORANDI_LIGHT_COLORS = ['#4A7B9C', '#9B6B6B', '#5F7256', '#B5A189', '#9251A8', '#7B9B9C', '#9B8B6B', '#725F56'];

interface PersonDetailModalProps {
  visible: boolean;
  person: Person | null;
  onCancel: () => void;
  onUpdate: () => void;
}

export function PersonDetailModal({ visible, person, onCancel, onUpdate }: PersonDetailModalProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (person) {
      setEvents(person.events || []);
      setAnnotations(person.annotations || []);
      setDevelopments(person.developments || []);
      setNotes(person.profile.notes || []);
    }
  }, [person]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingField && modalRef.current) {
        const target = event.target as HTMLElement;
        const isInput = target.tagName === 'INPUT';
        const isInModal = modalRef.current.contains(target);
        if (!isInput && isInModal) {
          setEditingField(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingField]);

  if (!person) return null;

  const handleEditStart = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const handleEditSave = async (field: string) => {
    try {
      setLoading(true);
      
      if (field === 'name') {
        await updatePerson(person.id, { name: editValue });
      } else {
        const newProfile = { ...person.profile, [field]: editValue || undefined };
        await updatePerson(person.id, { profile: newProfile });
      }
      
      message.success('更新成功');
      setEditingField(null);
      onUpdate();
    } catch (error) {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deletePersonApi(person.id);
      message.success('删除成功');
      onCancel();
      onUpdate();
    } catch (error) {
      message.error('删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = (index: number, field: keyof Event, value: string) => {
    const newEvents = [...events];
    newEvents[index] = { ...newEvents[index], [field]: value };
    setEvents(newEvents);
  };

  const handleDeleteEvent = (index: number) => {
    const newEvents = events.filter((_, i) => i !== index);
    setEvents(newEvents);
  };

  const handleAddEvent = () => {
    const newEvents = [...events, { date: '', description: '' }];
    setEvents(newEvents);
  };

  const handleEditAnnotation = (index: number, field: keyof Annotation, value: string) => {
    const newAnnotations = [...annotations];
    newAnnotations[index] = { ...newAnnotations[index], [field]: value };
    setAnnotations(newAnnotations);
  };

  const handleDeleteAnnotation = (index: number) => {
    const newAnnotations = annotations.filter((_, i) => i !== index);
    setAnnotations(newAnnotations);
  };

  const handleAddAnnotation = () => {
    setAnnotations([...annotations, { time: '', description: '' }]);
  };

  const handleEditDevelopment = (index: number, field: keyof Development, value: string) => {
    const newDevelopments = [...developments];
    newDevelopments[index] = { ...newDevelopments[index], [field]: value };
    setDevelopments(newDevelopments);
  };

  const handleDeleteDevelopment = (index: number) => {
    const newDevelopments = developments.filter((_, i) => i !== index);
    setDevelopments(newDevelopments);
  };

  const handleAddDevelopment = () => {
    setDevelopments([...developments, { content: '', type: 'resource' }]);
  };

  const handleEditNote = (index: number, value: string) => {
    const newNotes = [...notes];
    newNotes[index] = value;
    setNotes(newNotes);
  };

  const handleDeleteNote = (index: number) => {
    const newNotes = notes.filter((_, i) => i !== index);
    setNotes(newNotes);
  };

  const handleAddNote = () => {
    setNotes([...notes, '']);
  };

  const handleSaveNotes = async () => {
    try {
      setLoading(true);
      const newProfile = { ...person.profile, notes };
      await updatePerson(person.id, { profile: newProfile });
      message.success('更新成功');
      onUpdate();
    } catch (error) {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setLoading(true);
      
      await updatePerson(person.id, {
        events,
        annotations,
        developments,
      });
      
      message.success('保存成功');
      setEditingField(null);
      onUpdate();
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const renderEditableField = (field: string, label: string, currentValue: string | undefined, color: string) => {
    const isEditing = editingField === field;
    
    return (
      <div
        style={{
          background: '#F7F6F1',
          borderRadius: 16,
          padding: '16px 20px',
          marginBottom: 12,
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Text style={{ fontSize: 12, color: '#999', display: 'block', marginBottom: 4 }}>
              {label}
            </Text>
            {isEditing ? (
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditSave(field)}
                autoFocus
                style={{
                  border: '2px solid ' + color,
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 14,
                  outline: 'none',
                  width: 200,
                }}
              />
            ) : (
              <Text style={{ fontSize: 15, color: '#333', fontWeight: 500 }}>
                {currentValue || '暂无'}
              </Text>
            )}
          </div>
          <div>
            {isEditing ? (
              <Tooltip title="保存">
                <CheckOutlined
                  style={{
                    cursor: 'pointer',
                    color: color,
                    fontSize: 16,
                    padding: 8,
                    borderRadius: 8,
                    transition: 'all 0.2s',
                  }}
                  onClick={() => handleEditSave(field)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = color + '20';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                />
              </Tooltip>
            ) : (
              <Tooltip title="编辑">
                <EditOutlined
                  style={{
                    cursor: 'pointer',
                    color: color,
                    fontSize: 14,
                    padding: 8,
                    borderRadius: 8,
                    transition: 'all 0.2s',
                  }}
                  onClick={() => handleEditStart(field, currentValue || '')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = color + '20';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                />
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    );
  };

  const groupEventsByDate = (events: Event[]) => {
    const groups: Record<string, Event[]> = {};
    events.forEach((event, idx) => {
      const key = event.date || `no-date-${idx}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
    });
    return groups;
  };

  const renderDayEventCard = (date: string, dayEvents: Event[], startIndex: number) => {
    const locations = [...new Set(dayEvents.map(e => e.location).filter(Boolean))];
    
    return (
      <div
        key={date}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid #f0f0f0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: MORANDI_COLORS[0] + '15',
                  color: MORANDI_COLORS[0],
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <CalendarOutlined />
                {date.startsWith('no-date-') ? '无日期' : date}
              </div>
              {locations.map((loc, locIdx) => (
                <div
                  key={locIdx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: MORANDI_COLORS[2] + '15',
                    color: MORANDI_COLORS[2],
                    padding: '4px 10px',
                    borderRadius: 16,
                    fontSize: 11,
                  }}
                >
                  <EnvironmentOutlined style={{ fontSize: 11 }} />
                  {loc}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dayEvents.map((event, idxInDay) => {
                const globalIndex = startIndex + idxInDay;
                return (
                  <div key={globalIndex} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {editingField === `event-desc-${globalIndex}` ? (
                      <input
                        value={event.description}
                        onChange={(e) => handleEditEvent(globalIndex, 'description', e.target.value)}
                        placeholder="事件描述"
                        style={{
                          border: '2px solid ' + MORANDI_COLORS[0],
                          borderRadius: 8,
                          padding: '4px 10px',
                          fontSize: 14,
                          outline: 'none',
                          flex: 1,
                        }}
                        onBlur={() => setEditingField(null)}
                      />
                    ) : (
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#333',
                          lineHeight: 1.6,
                          cursor: 'pointer',
                          flex: 1,
                        }}
                        onClick={() => {
                          setEditingField(`event-desc-${globalIndex}`);
                          setEditValue(event.description);
                        }}
                      >
                        • {event.description || '点击添加描述'}
                      </Text>
                    )}
                    <Tooltip title="删除">
                      <DeleteOutlined
                        style={{
                          cursor: 'pointer',
                          color: '#999',
                          fontSize: 12,
                          padding: 4,
                          borderRadius: 4,
                          transition: 'all 0.2s',
                        }}
                        onClick={() => handleDeleteEvent(globalIndex)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ff4d4f';
                          e.currentTarget.style.background = '#fff1f0';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#999';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      />
                    </Tooltip>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnnotationCard = (ann: Annotation, index: number) => (
    <div
      key={index}
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid #f0f0f0',
        borderLeft: `4px solid ${MORANDI_COLORS[1]}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {editingField === `ann-time-${index}` ? (
              <input
                value={ann.time}
                onChange={(e) => handleEditAnnotation(index, 'time', e.target.value)}
                placeholder="YYYY-MM-DD"
                style={{
                  border: '2px solid ' + MORANDI_COLORS[1],
                  borderRadius: 8,
                  padding: '4px 10px',
                  fontSize: 13,
                  outline: 'none',
                  width: 120,
                }}
                autoFocus
              />
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: MORANDI_COLORS[1] + '15',
                  color: MORANDI_COLORS[1],
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => {
                  setEditingField(`ann-time-${index}`);
                  setEditValue(ann.time);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = MORANDI_COLORS[1] + '25';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = MORANDI_COLORS[1] + '15';
                }}
              >
                <CalendarOutlined />
                {ann.time || '点击添加时间'}
              </div>
            )}
            {ann.location && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: MORANDI_COLORS[2] + '15',
                  color: MORANDI_COLORS[2],
                  padding: '4px 10px',
                  borderRadius: 16,
                  fontSize: 11,
                }}
              >
                <EnvironmentOutlined style={{ fontSize: 11 }} />
                {ann.location}
              </div>
            )}
          </div>
          {editingField === `ann-desc-${index}` ? (
            <input
              value={ann.description}
              onChange={(e) => handleEditAnnotation(index, 'description', e.target.value)}
              placeholder="标注描述"
              style={{
                border: '2px solid ' + MORANDI_COLORS[1],
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 14,
                outline: 'none',
                width: '100%',
              }}
              onBlur={() => setEditingField(null)}
            />
          ) : (
            <Text
              style={{
                fontSize: 14,
                color: '#333',
                lineHeight: 1.6,
                cursor: 'pointer',
                display: 'block',
              }}
              onClick={() => {
                setEditingField(`ann-desc-${index}`);
                setEditValue(ann.description);
              }}
            >
              {ann.description || '点击添加描述'}
            </Text>
          )}
        </div>
        <Tooltip title="删除">
          <DeleteOutlined
            style={{
              cursor: 'pointer',
              color: '#999',
              fontSize: 14,
              padding: 6,
              borderRadius: 6,
              transition: 'all 0.2s',
            }}
            onClick={() => handleDeleteAnnotation(index)}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ff4d4f';
              e.currentTarget.style.background = '#fff1f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#999';
              e.currentTarget.style.background = 'transparent';
            }}
          />
        </Tooltip>
      </div>
    </div>
  );

  const renderDevelopmentTag = (dev: Development, index: number) => {
    const color = MORANDI_LIGHT_COLORS[index % MORANDI_LIGHT_COLORS.length];
    return (
      <div
        key={index}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: color + '15',
          padding: '10px 16px',
          borderRadius: 24,
          marginRight: 10,
          marginBottom: 10,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span style={{ fontSize: 14, color: color, fontWeight: 500 }}>
          {dev.content}
        </span>
        <Tooltip title="删除">
          <DeleteOutlined
            style={{
              cursor: 'pointer',
              color: color,
              fontSize: 12,
              opacity: 0.7,
              transition: 'opacity 0.2s',
            }}
            onClick={() => handleDeleteDevelopment(index)}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7';
            }}
          />
        </Tooltip>
      </div>
    );
  };

  const renderNoteTag = (note: string, index: number) => {
    const color = MORANDI_LIGHT_COLORS[index % MORANDI_LIGHT_COLORS.length];
    return (
      <div
        key={index}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: color + '20',
          padding: '8px 14px',
          borderRadius: 20,
          marginRight: 8,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13, color: color, fontWeight: 500 }}>
          {note}
        </span>
        <DeleteOutlined
          style={{
            cursor: 'pointer',
            color: color,
            fontSize: 11,
            opacity: 0.6,
          }}
          onClick={() => handleDeleteNote(index)}
        />
      </div>
    );
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={720}
      closeIcon={<CloseOutlined style={{ fontSize: 18, color: '#999' }} />}
      styles={{
        body: { padding: 0, background: '#F7F6F1' },
        mask: { background: 'rgba(0,0,0,0.4)' },
      }}
    >
      <div ref={modalRef} style={{ padding: '32px 32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${MORANDI_COLORS[person.id % MORANDI_COLORS.length]}, ${MORANDI_COLORS[(person.id + 2) % MORANDI_COLORS.length]})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 28,
                fontWeight: 'bold',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}
            >
              {person.name.charAt(0)}
            </div>
            <div style={{ marginLeft: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                {editingField === 'name' ? (
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave('name')}
                    autoFocus
                    style={{
                      border: '2px solid ' + MORANDI_COLORS[0],
                      borderRadius: 10,
                      padding: '8px 16px',
                      fontSize: 22,
                      fontWeight: 600,
                      outline: 'none',
                      width: 240,
                      color: MORANDI_COLORS[0],
                    }}
                  />
                ) : (
                  <>
                    <Title
                      level={2}
                      style={{
                        margin: 0,
                        color: MORANDI_COLORS[0],
                        fontSize: 24,
                        fontWeight: 600,
                      }}
                    >
                      {person.name}
                    </Title>
                    <Tooltip title="编辑姓名">
                      <EditOutlined
                        style={{
                          cursor: 'pointer',
                          color: MORANDI_COLORS[0],
                          fontSize: 16,
                          padding: 6,
                          borderRadius: 8,
                          opacity: 0.7,
                          transition: 'all 0.2s',
                        }}
                        onClick={() => handleEditStart('name', person.name)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.background = MORANDI_COLORS[0] + '15';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.7';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      />
                    </Tooltip>
                  </>
                )}
              </div>
              <Text style={{ fontSize: 15, color: '#666' }}>
                {person.profile.job || '暂无职业'}
              </Text>
            </div>
          </div>
          <Popconfirm
            title="确定要删除这个人吗？"
            description="此操作将永久删除该人物及其所有关联数据。"
            onConfirm={handleDelete}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              ghost
              icon={<DeleteOutlined />}
              loading={loading}
              style={{ borderRadius: 10, height: 40 }}
            >
              删除
            </Button>
          </Popconfirm>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Title level={5} style={{ color: MORANDI_COLORS[2], margin: 0, fontSize: 15 }}>
              基本信息
            </Title>
          </div>
          {renderEditableField('job', '职业', person.profile.job, MORANDI_COLORS[0])}
          {renderEditableField('birthday', '生日', person.profile.birthday, MORANDI_COLORS[2])}
          
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text strong style={{ color: MORANDI_COLORS[3], fontSize: 14 }}>
                其它信息
              </Text>
              <Space>
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={handleAddNote}
                  style={{ color: MORANDI_COLORS[3], borderRadius: 8 }}
                >
                  添加
                </Button>
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={handleSaveNotes}
                  loading={loading}
                  style={{ color: MORANDI_COLORS[0], borderRadius: 8 }}
                >
                  保存
                </Button>
              </Space>
            </div>
            <div
              style={{
                background: '#F7F6F1',
                borderRadius: 16,
                padding: 16,
                minHeight: 60,
              }}
            >
              {notes.length === 0 ? (
                <Text style={{ color: '#bbb', fontSize: 13 }}>
                  还没有添加其它信息
                </Text>
              ) : (
                notes.map((note, index) => (
                  <span key={index}>
                    {editingField === `note-${index}` ? (
                      <input
                        value={note}
                        onChange={(e) => handleEditNote(index, e.target.value)}
                        onBlur={() => setEditingField(null)}
                        autoFocus
                        style={{
                          border: '2px solid ' + MORANDI_LIGHT_COLORS[index % MORANDI_LIGHT_COLORS.length],
                          borderRadius: 20,
                          padding: '6px 12px',
                          fontSize: 13,
                          outline: 'none',
                          marginRight: 8,
                          marginBottom: 8,
                        }}
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingField(`note-${index}`);
                          setEditValue(note);
                        }}
                      >
                        {renderNoteTag(note, index)}
                      </span>
                    )}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ color: MORANDI_COLORS[0], margin: 0, fontSize: 15 }}>
              事件记录
            </Title>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddEvent}
              style={{ color: MORANDI_COLORS[0], borderRadius: 8 }}
            >
              添加事件
            </Button>
          </div>
          {events.length === 0 ? (
            <div
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 40,
                textAlign: 'center',
                border: '2px dashed #e8e8e8',
              }}
            >
              <Text style={{ color: '#bbb', fontSize: 14 }}>
                还没有事件记录
              </Text>
            </div>
          ) : (
            (() => {
              const groups = groupEventsByDate(events);
              let currentIndex = 0;
              return Object.entries(groups).map(([date, dayEvents]) => {
                const card = renderDayEventCard(date, dayEvents, currentIndex);
                currentIndex += dayEvents.length;
                return card;
              });
            })()
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ color: MORANDI_COLORS[1], margin: 0, fontSize: 15 }}>
              标注信息
            </Title>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddAnnotation}
              style={{ color: MORANDI_COLORS[1], borderRadius: 8 }}
            >
              添加标注
            </Button>
          </div>
          {annotations.length === 0 ? (
            <div
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 40,
                textAlign: 'center',
                border: '2px dashed #e8e8e8',
              }}
            >
              <Text style={{ color: '#bbb', fontSize: 14 }}>
                还没有标注信息
              </Text>
            </div>
          ) : (
            annotations.map((ann, index) => renderAnnotationCard(ann, index))
          )}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ color: MORANDI_COLORS[4], margin: 0, fontSize: 15 }}>
              发展方向
            </Title>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddDevelopment}
              style={{ color: MORANDI_COLORS[4], borderRadius: 8 }}
            >
              添加
            </Button>
          </div>
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 20,
              minHeight: 80,
            }}
          >
            {developments.length === 0 ? (
              <Text style={{ color: '#bbb', fontSize: 14 }}>
                还没有发展方向
              </Text>
            ) : (
              <div>
                {developments.map((dev, index) => (
                  <span key={index}>
                    {editingField === `dev-${index}` ? (
                      <input
                        value={dev.content}
                        onChange={(e) => handleEditDevelopment(index, 'content', e.target.value)}
                        onBlur={() => setEditingField(null)}
                        autoFocus
                        style={{
                          border: '2px solid ' + MORANDI_LIGHT_COLORS[index % MORANDI_LIGHT_COLORS.length],
                          borderRadius: 24,
                          padding: '8px 16px',
                          fontSize: 14,
                          outline: 'none',
                          marginRight: 10,
                          marginBottom: 10,
                        }}
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingField(`dev-${index}`);
                          setEditValue(dev.content);
                        }}
                      >
                        {renderDevelopmentTag(dev, index)}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div style={{ padding: '0 32px 24px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            size="large"
            icon={<CheckOutlined />}
            onClick={handleSaveAll}
            loading={loading}
            style={{
              background: MORANDI_COLORS[0],
              border: 'none',
              borderRadius: 10,
              height: 44,
              paddingLeft: 32,
              paddingRight: 32,
            }}
          >
            保存所有修改
          </Button>
        </div>
      </div>
    </Modal>
  );
}
