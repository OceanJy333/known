'use client'

import React from 'react'
import { ConnectionStatus, OutputNodeConnection } from '@/types/outputNode'

interface ConnectionHoverCardProps {
  connection: OutputNodeConnection
  position: { x: number; y: number }
  onClose?: () => void
  onDisconnect?: () => void
  onStatusChange?: (status: ConnectionStatus) => void
}

export function ConnectionHoverCard({
  connection,
  position,
  onClose,
  onDisconnect,
  onStatusChange
}: ConnectionHoverCardProps) {
  // 格式化时间显示
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    if (minutes > 0) return `${minutes}分钟前`
    return '刚刚'
  }

  // 获取状态文本
  const getStatusText = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.ACTIVE:
        return '激活'
      case ConnectionStatus.RELATED:
        return '相关'
      case ConnectionStatus.DISABLED:
        return '已断开'
      case ConnectionStatus.NEW:
        return '新建'
      case ConnectionStatus.FLOWING:
        return '处理中'
      case ConnectionStatus.ERROR:
        return '错误'
      default:
        return '未知'
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.ACTIVE:
        return '#3b82f6'
      case ConnectionStatus.RELATED:
        return '#6b7280'
      case ConnectionStatus.DISABLED:
        return '#ef4444'
      case ConnectionStatus.NEW:
        return '#10b981'
      case ConnectionStatus.FLOWING:
        return '#10b981'
      case ConnectionStatus.ERROR:
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  return (
    <div
      className="connection-hover-card"
      style={{
        position: 'absolute',
        left: position.x + 10,
        top: position.y - 60,
        zIndex: 9999
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="card-header">
        <h3>连接信息</h3>
        <button className="close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="card-content">
        <div className="info-row">
          <span className="label">状态</span>
          <span className="value" style={{ color: getStatusColor(connection.status) }}>
            {getStatusText(connection.status)}
          </span>
        </div>

        <div className="info-row">
          <span className="label">强度</span>
          <div className="strength-bar">
            <div 
              className="strength-fill"
              style={{ 
                width: `${connection.strength * 100}%`,
                backgroundColor: getStatusColor(connection.status)
              }}
            />
            <span className="strength-text">{Math.round(connection.strength * 100)}%</span>
          </div>
        </div>

        <div className="info-row">
          <span className="label">创建时间</span>
          <span className="value">{formatTime(connection.createdAt)}</span>
        </div>

        {connection.lastUsedAt && (
          <div className="info-row">
            <span className="label">最后使用</span>
            <span className="value">{formatTime(connection.lastUsedAt)}</span>
          </div>
        )}
      </div>

      <div className="card-actions">
        {/* 状态切换按钮 */}
        <div className="status-buttons">
          {connection.status !== ConnectionStatus.ACTIVE && (
            <button
              className="status-btn active"
              onClick={() => onStatusChange?.(ConnectionStatus.ACTIVE)}
              title="设为激活"
            >
              <i className="fas fa-check"></i>
            </button>
          )}
          {connection.status !== ConnectionStatus.RELATED && (
            <button
              className="status-btn related"
              onClick={() => onStatusChange?.(ConnectionStatus.RELATED)}
              title="设为相关"
            >
              <i className="fas fa-link"></i>
            </button>
          )}
          {connection.status !== ConnectionStatus.DISABLED && (
            <button
              className="status-btn disabled"
              onClick={() => onStatusChange?.(ConnectionStatus.DISABLED)}
              title="禁用连接"
            >
              <i className="fas fa-ban"></i>
            </button>
          )}
        </div>

        {/* 断开连接按钮 */}
        <button className="disconnect-btn" onClick={onDisconnect}>
          <i className="fas fa-unlink"></i>
          断开连接
        </button>
      </div>

      <style jsx>{`
        .connection-hover-card {
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          backdrop-filter: blur(20px);
          min-width: 240px;
          overflow: hidden;
          font-size: 13px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          background: rgba(249, 250, 251, 0.5);
        }

        .card-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .close-btn {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #374151;
        }

        .card-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .label {
          color: #6b7280;
          font-weight: 500;
        }

        .value {
          color: #111827;
          font-weight: 600;
        }

        .strength-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          max-width: 120px;
        }

        .strength-bar {
          position: relative;
          height: 6px;
          background: rgba(0, 0, 0, 0.08);
          border-radius: 3px;
          overflow: hidden;
          flex: 1;
        }

        .strength-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          transition: width 0.3s ease;
        }

        .strength-text {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          min-width: 35px;
          text-align: right;
        }

        .card-actions {
          padding: 12px 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .status-buttons {
          display: flex;
          gap: 8px;
        }

        .status-btn {
          flex: 1;
          padding: 6px 12px;
          border: 1px solid transparent;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.04);
          color: #6b7280;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .status-btn:hover {
          background: rgba(0, 0, 0, 0.08);
        }

        .status-btn.active:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
          color: #3b82f6;
        }

        .status-btn.related:hover {
          background: rgba(107, 114, 128, 0.1);
          border-color: rgba(107, 114, 128, 0.3);
          color: #6b7280;
        }

        .status-btn.disabled:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .disconnect-btn {
          width: 100%;
          padding: 8px 16px;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          background: rgba(239, 68, 68, 0.05);
          color: #ef4444;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .disconnect-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .disconnect-btn i {
          font-size: 12px;
        }
      `}</style>
    </div>
  )
}