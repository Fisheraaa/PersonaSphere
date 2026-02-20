import { useEffect, useRef, useState } from 'react';
import { Card, Typography, Empty, Spin, Button, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import cytoscape from 'cytoscape';
import { useAppStore } from '../store';
import { saveGraphLayout, getGraphLayout } from '../api';
import { PersonDetailModal } from './PersonDetailModal';
import type { Person } from '../types';

const { Title, Text } = Typography;

const MORANDI_COLORS = ['#4A7B9C', '#9B6B6B', '#5F7256', '#B5A189', '#9251A8'];

export function GraphPage() {
  const { graphData, fetchGraphData: loadGraph, loading, persons, fetchPersons } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ id: number; name: string; job?: string } | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const autoSaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    loadGraph();
    fetchPersons();
  }, [loadGraph, fetchPersons]);

  useEffect(() => {
    if (!graphData || !containerRef.current || graphData.nodes.length === 0) return;

    const initializeCytoscape = async () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }

      const nodeDegrees: Record<number, number> = {};
      graphData.nodes.forEach(node => {
        nodeDegrees[node.id] = 0;
      });
      graphData.edges.forEach(edge => {
        nodeDegrees[edge.source] = (nodeDegrees[edge.source] || 0) + 1;
        nodeDegrees[edge.target] = (nodeDegrees[edge.target] || 0) + 1;
      });

      const elements = [
        ...graphData.nodes.map(node => ({
          data: {
            id: String(node.id),
            name: node.name,
            avatar: node.avatar,
            degree: nodeDegrees[node.id] || 0,
          },
        })),
        ...graphData.edges.map((edge, idx) => ({
          data: {
            id: `edge-${idx}`,
            source: String(edge.source),
            target: String(edge.target),
            relation_type: edge.relation_type,
          },
        })),
      ];

      let hasSavedLayout = false;
      let savedLayoutData: any = null;
      
      try {
        savedLayoutData = await getGraphLayout();
        hasSavedLayout = savedLayoutData && (
          (savedLayoutData.nodes && Object.keys(savedLayoutData.nodes).length > 0) || 
          Object.keys(savedLayoutData).length > 0
        );
      } catch (error) {
        console.log('没有保存的布局，使用默认布局');
      }

      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              'background-color': (ele: any) => {
                const id = parseInt(ele.id());
                return MORANDI_COLORS[id % MORANDI_COLORS.length];
              },
              'label': 'data(name)',
              'font-size': '12px',
              'color': '#333',
              'text-valign': 'center',
              'text-halign': 'center',
              'width': (ele: any) => 40 + (ele.data('degree') || 0) * 8,
              'height': (ele: any) => 40 + (ele.data('degree') || 0) * 8,
              'shape': 'ellipse',
              'border-width': 2,
              'border-color': '#fff',
            },
          },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': '#B5A189',
              'target-arrow-shape': 'none',
              'curve-style': 'bezier',
              'label': 'data(relation_type)',
              'font-size': '10px',
              'color': '#666',
              'text-background-color': '#F7F6F1',
              'text-background-opacity': 1,
              'text-background-padding': '2px',
            },
          },
        ],
        layout: hasSavedLayout 
          ? { name: 'preset' }
          : {
              name: 'cose',
              animate: true,
              animationDuration: 1000,
              nodeRepulsion: 4000,
              idealEdgeLength: 150,
            },
        minZoom: 0.5,
        maxZoom: 2,
      });

      if (hasSavedLayout && savedLayoutData) {
        const nodesData = savedLayoutData.nodes || savedLayoutData;
        cy.nodes().forEach((node) => {
          const pos = nodesData[node.id()];
          if (pos) {
            node.position(pos);
          }
        });
        
        if (savedLayoutData.zoom && savedLayoutData.pan) {
          cy.zoom(savedLayoutData.zoom);
          cy.pan(savedLayoutData.pan);
        } else {
          cy.fit();
        }
      }

      cy.on('mouseover', 'node', (event) => {
        const node = event.target;
        const person = persons.find(p => p.id === parseInt(node.id()));
        const nodeSize = 40 + ((node.data('degree') || 0) * 8);
        setHoveredNode({
          id: parseInt(node.id()),
          name: node.data('name'),
          job: person?.profile?.job,
        });
        setHoverPosition({ 
          x: event.renderedPosition.x + nodeSize / 2 + 20, 
          y: event.renderedPosition.y - 40 
        });
      });

      cy.on('mouseout', 'node', () => {
        setHoveredNode(null);
      });

      cy.on('dbltap', 'node', (event) => {
        const node = event.target;
        const person = persons.find(p => p.id === parseInt(node.id()));
        if (person) {
          setSelectedPerson(person);
          setShowDetail(true);
        }
      });

      const autoSave = () => {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
        autoSaveTimerRef.current = setTimeout(async () => {
          const layout: Record<string, any> = {};
          cy.nodes().forEach((node) => {
            layout[node.id()] = node.position();
          });
          const zoom = cy.zoom();
          const pan = cy.pan();
          const dataToSave = {
            nodes: layout,
            zoom: zoom,
            pan: pan
          };
          try {
            await saveGraphLayout(dataToSave);
          } catch (error) {
            console.error('保存布局失败:', error);
          }
        }, 1000);
      };

      cy.on('dragfree', 'node', autoSave);
      cy.on('zoom', autoSave);
      cy.on('pan', autoSave);

      cyRef.current = cy;
    };

    initializeCytoscape();

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [graphData, persons]);

  const handleDetailCancel = () => {
    setShowDetail(false);
    setSelectedPerson(null);
  };

  const handleDetailUpdate = () => {
    loadGraph();
    fetchPersons();
  };

  const handleSave = async () => {
    if (!cyRef.current) return;
    setSaving(true);
    const layout: Record<string, any> = {};
    cyRef.current.nodes().forEach((node) => {
      layout[node.id()] = node.position();
    });
    const zoom = cyRef.current.zoom();
    const pan = cyRef.current.pan();
    const dataToSave = {
      nodes: layout,
      zoom: zoom,
      pan: pan
    };
    try {
      await saveGraphLayout(dataToSave);
      message.success('布局保存成功！');
    } catch (error) {
      console.error('保存布局失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: 'none',
      }}
      title={
        <Title level={4} style={{ color: MORANDI_COLORS[0], margin: 0 }}>
          关系网络图
        </Title>
      }
      extra={
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
        >
          保存布局
        </Button>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : !graphData || graphData.nodes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Empty
            description="暂无关系网络数据"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div
            ref={containerRef}
            style={{
              width: '100%',
              height: 600,
              background: '#F7F6F1',
              borderRadius: 8,
            }}
          />
          {hoveredNode && (
            <div
              style={{
                position: 'absolute',
                left: hoverPosition.x,
                top: hoverPosition.y,
                pointerEvents: 'none',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  background: '#fff',
                  padding: '12px 16px',
                  borderRadius: 12,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  border: '1px solid #f0f0f0',
                }}
              >
                <Text strong style={{ display: 'block', fontSize: 15, color: MORANDI_COLORS[0] }}>
                  {hoveredNode.name}
                </Text>
                {hoveredNode.job && (
                  <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
                    {hoveredNode.job}
                  </Text>
                )}
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: 12, 
                    display: 'block', 
                    marginTop: 8,
                    color: '#aaa'
                  }}
                >
                  双击查看详情
                </Text>
              </div>
            </div>
          )}
        </div>
      )}
      <PersonDetailModal
        visible={showDetail}
        person={selectedPerson}
        onCancel={handleDetailCancel}
        onUpdate={handleDetailUpdate}
      />
    </Card>
  );
}
