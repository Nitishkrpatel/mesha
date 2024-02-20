import React from 'react';
import ReactDOM from 'react-dom';
import './assets/css/App.css';
import { HashRouter, Route, Switch, Redirect } from 'react-router-dom';
import AuthLayout from './layouts/auth';
import AdminLayout from './layouts/admin';
import RtlLayout from './layouts/rtl';
import AdminMain from 'layouts/adminmain/adminmain';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme/theme';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ThemeEditorProvider } from '@hypertheme-editor/chakra-ui';
import Main from 'solution/building/main'
import KeycloakProvider from 'auth/KeycloakProvider';

ReactDOM.render(
	<ChakraProvider theme={theme}>
		<React.StrictMode>
		<KeycloakProvider>
			<ThemeEditorProvider>
				<HashRouter>
					<Switch>
						<Route path={`/auth`} component={AuthLayout} />
						<Route path={`/admin`} component={AdminLayout} />						
						<Redirect from='/' to='/admin' />      					
					</Switch>
				</HashRouter>
			</ThemeEditorProvider>
			</KeycloakProvider>
		</React.StrictMode>
	</ChakraProvider>,
	document.getElementById('root')
);
