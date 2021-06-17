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
 import { Image, StyleSheet, View, Animated, TouchableOpacity, I18nManager } from 'react-native';

 import { Layout, Text, withStyles, ThemeType } from 'react-native-ui-kitten';
 import { bind as autobind, debounce } from 'lodash-decorators';
 import { Avatar, Badge, Icon, ListItem } from 'react-native-elements';

 
 import { IGlobalState } from '@models/app/global-state.model';
 
 import { IAppScreenProps } from '@interfaces/app-screen-props.interface';
 import { IAppScreen } from '@interfaces/app-screen.interface';
 import { IIssueJSON } from '@models/app/issue-json.model';
 import { IIssueGroup } from '@models/actions-results.model';
 import { Navigator } from '@navigation/navigator';
 import { ScreenRoute } from '@enums/routes.enum';
 import { setGitHubIssuesFilter, loadGitHubIssueItemsAsync } from '@actions/app.actions';
import { WalletCard } from '@components/wallet-card.component';

 // Debounce Decorator Function Options
 const debOptions: object = {leading: true, trailing: false};

 interface IMapStateToProps {
   gitHubIssuesItems: IIssueJSON[];
   gitHubIssuesGroups: IIssueGroup[];
   gitHubIssuesTotalCount: number;
   isLoadingGitHubIssuesItems: boolean;
   gitHubIssuesLoadingError: string;
 }

 interface IMapDispatchToProps {
  loadGitHubIssueItemsAsync: typeof loadGitHubIssueItemsAsync;
  setGitHubIssuesFilter: typeof setGitHubIssuesFilter;
 }

 export interface IMainScreenProps extends IAppScreenProps, IMapStateToProps, IMapDispatchToProps {}

 export interface IMainScreenState {}


 class MainScreenComponent extends React.Component<IMainScreenProps, IMainScreenState> implements IAppScreen {

  private readonly testIdPrefix: string = 'main_screen';

   public state: IMainScreenState = {};
   // ---------------------

   componentDidMount(): void {}
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
   private goBack(): void {
     Navigator.popScreen(this.props.componentId);
   }
   // ---------------------


    private renderListHeaderComponent() {
      return (
        <View style={[styles.walletHeader]}>
          <Text textBreakStrategy="simple" style={[styles.headerText]}>
            {'Wallet'}
          </Text>
        </View>
      );
    };

    private renderSendButton() {
      return (
        <TouchableOpacity style={[styles.sendRoot]} >
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
  

   public render(): React.ReactElement {
     return (
       <Layout level="2" style={styles.container}>
        {<WalletCard/>}
        {this.renderSendButton()}
        </Layout>
      );
   }
 }

 // Styles -----------------------------------------------------------------------------------
 const styles: StyleSheet.NamedStyles<any> = StyleSheet.create({
   container: {
     flex: 1,
     alignItems: 'center'
   },
   sendRoot: {
    marginHorizontal: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#ccddf9',
    width: 120, 
    height: 50 
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
 });
 // ------------------------------------------------------------------------------------------


 // Connecting To Redux ----------------------------------------------------------------------
 function mapStateToProps(state: IGlobalState): any {
   return {
     gitHubIssuesFilter: state.app.gitHubIssuesFilter,
     gitHubIssuesItems: state.app.gitHubIssuesItems,
     gitHubIssuesGroups: state.app.gitHubIssuesGroups,
     gitHubIssuesTotalCount: state.app.totalCount,
     isLoadingGitHubIssuesItems: state.app.isLoadingGitHubIssuesItems,
     gitHubIssuesLoadingError: state.app.gitHubIssuesLoadingError
   };
 }
 // -----------

 function mapDispatchToProps(dispatch: Dispatch<any>): any {
   return {
     ...bindActionCreators({
      loadGitHubIssueItemsAsync,
      setGitHubIssuesFilter
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