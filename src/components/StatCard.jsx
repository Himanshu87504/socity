import React from 'react';
export default function StatCard({ icon: Icon, label, value, sub, color, trend }) {
    return (<div className="stat-card" style={{ '--card-accent': color }}>
      <div className="stat-card-top">
        <div className="stat-icon-wrap" style={{ background: `${color}18` }}>
          <Icon size={22} style={{ color }}/>
        </div>
        {trend !== undefined && (<span className={`stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>)}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      <div className="stat-card-bar" style={{ background: color }}/>
    </div>);
}
