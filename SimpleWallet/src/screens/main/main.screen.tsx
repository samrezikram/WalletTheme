/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

 import React from 'react';
 import { Dispatch, bindActionCreators } from 'redux';
 import { connect } from 'react-redux';
 import { Image, StyleSheet, View, Animated, TouchableOpacity, I18nManager, FlatList, NativeModules, Platform } from 'react-native';

 import { Layout, Text, withStyles, ThemeType } from 'react-native-ui-kitten';
 import { bind as autobind, debounce } from 'lodash-decorators';
 import { Avatar, Badge, Icon, ListItem } from 'react-native-elements';

 
 import { IGlobalState } from '@models/app/global-state.model';
 
 import { IAppScreenProps } from '@interfaces/app-screen-props.interface';
 import { IAppScreen } from '@interfaces/app-screen.interface';
 import { Navigator } from '@navigation/navigator';
 import { loadTransactionItemsAsync } from '@actions/app.actions';
import { WalletCard } from '@components/wallet-card.component';
import { ITransaction } from '@models/app/transaction.model';
import { TransactionCard } from '@components/transaction-card.component';

import Braintree from './Braintree';
 // Debounce Decorator Function Options
 const debOptions: object = {leading: true, trailing: false};

 interface IMapStateToProps {
   transactionItems: ITransaction[];
   totalTransactionCount: number;
   isLoadingTransactionItems: boolean;
   transactionsLoadingError: string;
 }

 interface IMapDispatchToProps {
  loadTransactionItemsAsync: typeof loadTransactionItemsAsync;
 }

 export interface IMainScreenProps extends IAppScreenProps, IMapStateToProps, IMapDispatchToProps {}

 export interface IMainScreenState {}


 class MainScreenComponent extends React.Component<IMainScreenProps, IMainScreenState> implements IAppScreen {

  private readonly testIdPrefix: string = 'main_screen';

   public state: IMainScreenState = {};
   // ---------------------

   componentDidMount(): void {
    this.props.loadTransactionItemsAsync();
   }
   // ---------------------



private scaleValue = new Animated.Value(1.0);

private onPressedIn(): void {
  const animations: Animated.CompositeAnimation[] = [
    Animated.spring(this.scaleValue, {
      toValue: 0.9,
      useNativeDriver: true
    }),
    Animated.timing(this.scaleValue, {
      toValue: 1.0,
      duration: 50,
      useNativeDriver: true
    })
  ];
  Animated.parallel(animations).start();
}
// ---------------------


   @autobind
   @debounce(500, debOptions)
   private onPressSendPayment(): void {

    if(Platform.OS === 'android') {
      NativeModules.RNBraintree.setup('sandbox_6m8chzhc_582rwhs5bm3jdj9v').then((success)=> {
        }).catch((error)=>{
        });
      NativeModules.RNBraintree.showPaymentViewController().then((nonce) => {
          //payment succeeded, pass nonce to server
          console.log('nonce: ' + nonce)
        })
        .catch((err)=> {
          console.log(err)
        });
    } else {
      Braintree.setup("sandbox_6m8chzhc_582rwhs5bm3jdj9v");

      Braintree.showPaymentViewController().then((nonce) => {
        //payment succeeded, pass nonce to server
        console.log('nonce: ' + nonce)
      })
      .catch((err)=> {
        console.log(err)
      });
    }
  }

   // ---------------------

  renderSeparator = () => {
    return <View style={styles.separator} />;
  };

  private renderSendButton() {
    return (
      <TouchableOpacity style={[styles.sendRoot]} onPress={this.onPressSendPayment}>
        <View style={styles.icon}>
          <Icon
              name="wallet-outline"
              size={25}
              type="ionicon"
              color={'#2f5fb3'}
          />
        </View>
        <Text numberOfLines={1} style={[styles.text]}>
          {'Send'}
        </Text>
      </TouchableOpacity>
    );
  }

  private onTransactionCardPressed(transaction: ITransaction): () => void {
    return () => {
     if (transaction && transaction?.paymentData) {
     }
    };
  }

  @autobind
  private renderTransactionsHeaderComponent(): React.ReactElement {
    return (
      <Text category="h6" style={styles.transactionListSectionHeader}>
        {'Transactions'}
      </Text>
    );
  }
  // ---------------------

  @autobind
  private _renderItem({ item, index }: {item: ITransaction | any, index: number}): React.ReactElement {
    return (
      <View style={styles.transactionItemContainer}>
        <TransactionCard
          transaction={item}
          onPress={this.onTransactionCardPressed(item)}/>
      </View>
    );
  }
  // ---------------------


  public render(): React.ReactElement {
    return (
      <Layout level="2" style={styles.container}>
        {<WalletCard/>}
        {this.renderSendButton()}
        <FlatList
          ListHeaderComponent={this.renderTransactionsHeaderComponent}
          style={{flex: 1}}
                data={this.props.transactionItems}
                renderItem={this._renderItem}
                keyExtractor={(_item, index) => `${index}`}
                ItemSeparatorComponent={this.renderSeparator}
        />
      </Layout>
    );
  }
 }

 // Styles -----------------------------------------------------------------------------------
 const styles: StyleSheet.NamedStyles<any> = StyleSheet.create({
   container: {
     flex: 1,
   },
   sendRoot: {
    marginHorizontal: 120,
    paddingVertical: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: '#ccddf9',
  },
  icon: {
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 10,
    backgroundColor: 'transparent',
    color: '#2f5fb3'
  },
  separator: {
    backgroundColor: '#d2d2d2',
    height: 0.5,
    marginBottom: 4,
    marginHorizontal: 50
  },
  transactionListSectionHeader: {
    paddingTop: 16,
    paddingHorizontal: 16
  },
  transactionItemContainer: {
    paddingTop: 10,
    marginBottom: 16
  },
 });
 // ------------------------------------------------------------------------------------------


 // Connecting To Redux ----------------------------------------------------------------------
 function mapStateToProps(state: IGlobalState): any {
   return {
     transactionItems: state.app.transactionItems,
     totalTransactionCount: state.app.totalTransactionCount,
     isLoadingTransactionItems: state.app.isLoadingTransactionItems,
     transactionLoadingError: state.app.transactionLoadingError
   };
 }
 // -----------

 function mapDispatchToProps(dispatch: Dispatch<any>): any {
   return {
     ...bindActionCreators({
      loadTransactionItemsAsync
     }, dispatch),
   };
 }
 // ----------------------------------

 const MainScreenConnected = connect(mapStateToProps, mapDispatchToProps)(MainScreenComponent);

 export const MainScreen = withStyles(MainScreenConnected, (theme: ThemeType) => ({
   selectedTabHighlighter: {
     backgroundColor: theme['color-primary-500']
   },
   layoutLevel2: {
     backgroundColor: theme['background-basic-color-2'],
   },
   layoutLevel3: {
     backgroundColor: theme['background-basic-color-3'],
   }
 }));