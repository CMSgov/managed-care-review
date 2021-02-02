import React from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { Header } from '../../components/Header/Header'
import { Auth } from '../Auth/Auth'
import './App.scss'
import { logEvent } from '../../log_event'
import { CheckAuth } from '../Auth/CheckAuth'

const Dashboard = (): React.ReactElement => {
    return <div>Dashboard!</div>
}

const Landing = (): React.ReactElement => {
    return <div>Landing Page</div>
}

function App(): React.ReactElement {
    logEvent('on_load', { success: true })

    return (
        <Router>
            <div className="App">
                <Header stateCode="TN" />
                <main>
                    <h1>Main Content</h1>
                    <Switch>
                        <Route path="/auth">
                            <Auth />
                        </Route>
                        <Route path="/dashboard">
                            <Dashboard />
                        </Route>
                        <Route path="/">
                            <Landing />
                        </Route>
                    </Switch>
                    <CheckAuth />
                </main>
            </div>
        </Router>
    )
}

export default App
