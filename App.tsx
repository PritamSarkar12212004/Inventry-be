import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import codePush from '@revopush/react-native-code-push';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ErrorBoundary } from 'react-error-boundary';
import { paperTheme } from './src/core/theme';
import RootNavigator from './src/core/navigation/RootNavigator';
import ErrorFallback from './src/core/layouts/ErrorFallback';
import { IosPopupHost } from './src/core/components/IosPopupHost';
import { CodePushUpdater } from './src/core/components/CodePushUpdater';
import { queryClient } from './src/core/util/queryClient';

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <QueryClientProvider client={queryClient}>
            <PaperProvider theme={paperTheme}>
              <BottomSheetModalProvider>
                <StatusBar barStyle="dark-content" />
                <RootNavigator />
                <IosPopupHost />
                <CodePushUpdater />
              </BottomSheetModalProvider>
            </PaperProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default codePush({
  checkFrequency: codePush.CheckFrequency.MANUAL,
})(App);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
