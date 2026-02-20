import { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import { UserOutlined, TeamOutlined, BulbOutlined } from '@ant-design/icons';
import { InfoPage } from './InfoPage';
import { GraphPage } from './GraphPage';
import { CirclesPage } from './CirclesPage';

const { Header, Sider, Content } = Layout;

const MORANDI_COLORS = ['#4A7B9C', '#9B6B6B', '#5F7256', '#B5A189', '#9251A8'];

type PageType = 'info' | 'graph' | 'circles';

export function MainLayout() {
  const [currentPage, setCurrentPage] = useState<PageType>('info');
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: 'info',
      icon: <UserOutlined />,
      label: '信息',
    },
    {
      key: 'graph',
      icon: <TeamOutlined />,
      label: '关系网',
    },
    {
      key: 'circles',
      icon: <BulbOutlined />,
      label: '圈子',
    },
  ];

  const renderContent = () => {
    switch (currentPage) {
      case 'info':
        return <InfoPage />;
      case 'graph':
        return <GraphPage />;
      case 'circles':
        return <CirclesPage />;
      default:
        return <InfoPage />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={220}
        style={{ background: '#F7F6F1' }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
          }}
        >
          <span
            style={{
              fontSize: collapsed ? 14 : 18,
              fontWeight: 'bold',
              color: MORANDI_COLORS[0],
            }}
          >
            {collapsed ? '人脉' : '智能人脉管理'}
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={({ key }) => setCurrentPage(key as PageType)}
          style={{ border: 'none', background: '#F7F6F1' }}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 24,
            }}
          >
            <h2 style={{ margin: 0, color: MORANDI_COLORS[0] }}>
              {menuItems.find(item => item.key === currentPage)?.label}
            </h2>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#F7F6F1',
            borderRadius: borderRadiusLG,
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}
