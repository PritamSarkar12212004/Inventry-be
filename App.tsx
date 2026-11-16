import React from 'react';
import { StatusBar } from 'react-native';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { paperTheme } from './src/core/theme';
import RootNavigator from './src/core/navigation/RootNavigator';
import ErrorFallback from './src/core/layouts/ErrorFallback';
import { IosPopupHost } from './src/core/components/IosPopupHost';
import { ErrorBoundary } from 'react-error-boundary';
import { queryClient } from './src/core/util/queryClient';

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={paperTheme}>
            <StatusBar barStyle="dark-content" />
            <RootNavigator />
            <IosPopupHost />
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
