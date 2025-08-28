import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import TimeSheet from "./TimeSheet";

import PTO from "./PTO";

import AccessDenied from "./AccessDenied";

import NotFound from "./NotFound";

import Team from "./Team";

import Reports from "./Reports";

import Admin from "./Admin";

import DeveloperDocs from "./DeveloperDocs";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    TimeSheet: TimeSheet,
    
    PTO: PTO,
    
    AccessDenied: AccessDenied,
    
    NotFound: NotFound,
    
    Team: Team,
    
    Reports: Reports,
    
    Admin: Admin,
    
    DeveloperDocs: DeveloperDocs,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/TimeSheet" element={<TimeSheet />} />
                
                <Route path="/PTO" element={<PTO />} />
                
                <Route path="/AccessDenied" element={<AccessDenied />} />
                
                <Route path="/NotFound" element={<NotFound />} />
                
                <Route path="/Team" element={<Team />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/DeveloperDocs" element={<DeveloperDocs />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}