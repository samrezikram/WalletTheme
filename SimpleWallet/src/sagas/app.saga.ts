import { IGitHubIssuesRequest, IGithubRepoIssuesResponse } from './../models/http/issue.model';
import { SagaIterator } from 'redux-saga';
import { takeLeading, takeLatest, put, call, select } from 'redux-saga/effects';

import { LocalStorageKey } from '@enums/local-storage-keys.enum';
import { AppActionsTypes } from '@enums/actions-types.enum';

import { IFetchIssueGlobalError, ISagaThrownError } from '@models/app/errors.model';
import { IGlobalState } from '@models/app/global-state.model';
import { IIssueJSON } from '@models/app/issue-json.model';
import { IIssueGroup, IGithubIssuesSagaTriggerObject } from '@models/actions-results.model';

import { _setDoneInitilizingApp, _setIsLoadingGitHubIssuesItems, _setTotalGitHubIssuesCount, _setGitHubIssuesItems, _setGitHubIssuesGroups, _setGitHubLoadingError, setGitHubIssuesFilter } from '@actions/app.actions';

import { getInitialAppState } from '@store/initial-state';

import { SagaErrorHandler } from '@error-handlers/saga-error-handler';
import { emitNextAndComplete, throwError } from '@utils/rxjs-subject-safe-handler';

import _ from 'lodash';
import moment from 'moment';

// Selectors ------------------------------------------------------------------------------------
function getGitHubIssuesFilter(state: IGlobalState): IGitHubIssuesRequest {
  return state.app.gitHubIssuesFilter || getInitialAppState().gitHubIssuesFilter || {} as IGitHubIssuesRequest;
}
// -------------------

function getGitHubIssuesItems(state: IGlobalState): IIssueJSON[] {
  return state.app.gitHubIssuesItems ?? [];
}
// -------------------

function getTotalGitHubIssuesCount(state: IGlobalState): number {
  return state.app.totalCount ?? 0;
}
// ----------------------------------------------------------------------------------------------

// App Sagas ----------------------------------------------------------------------------------
function* initAppStateSaga(): SagaIterator {
  yield put(_setDoneInitilizingApp(true));
}
// -------------------

function* githubRepositoryIssuesListSaga(sagaData: IGithubIssuesSagaTriggerObject): SagaIterator  {
  const sagaName: string = 'githubRepositoryIssuesListSaga';
  try {
    const sendGitHubIssueRequest: IGitHubIssuesRequest = {} as IGitHubIssuesRequest;
    if (sagaData && sagaData.payload &&  sagaData.payload.clearPreviousGitHubIssuesItems) {
      yield put(_setTotalGitHubIssuesCount(0));
      yield put(_setGitHubIssuesItems([]));
    }
    yield put(_setIsLoadingGitHubIssuesItems(true));
    yield put(_setGitHubLoadingError(''));
    const gitHubIssuesFilter: IGitHubIssuesRequest = _.cloneDeep(yield select(getGitHubIssuesFilter));

    
    if (sagaData && sagaData.payload || (sagaData.payload.organization && sagaData.payload.repo)) {
      sendGitHubIssueRequest.org = sagaData.payload.organization ? sagaData.payload.organization : 'organization';
      sendGitHubIssueRequest.repo = sagaData.payload.repo ? sagaData.payload.repo : '';
      sendGitHubIssueRequest.page = gitHubIssuesFilter.page;
      sendGitHubIssueRequest.per_page = gitHubIssuesFilter.per_page;

      // const incomingGithubIssuesItems: IGithubRepoIssuesResponse = yield call(GitHubService.getRepositoryIssues.bind(GitHubService), sendGitHubIssueRequest);

     
      const currentGitHubIssuesItems: IIssueJSON[] = yield select(getGitHubIssuesItems);

      yield put(_setIsLoadingGitHubIssuesItems(false));
      yield put(_setGitHubLoadingError(''));
      emitNextAndComplete(sagaData._observable, true);
    } else {
      const handledError: ISagaThrownError = handleError(new Error, 'Abnormal Behavior from GitHub Rest Api. Fetch Issues returned "null" or a invalid Issues array', sagaName, sagaData.showErrorAlerts, sagaData.onErrorAlertDismissal);
      yield put(_setGitHubLoadingError(handledError.message));
      yield put(_setIsLoadingGitHubIssuesItems(false));
      emitNextAndComplete(sagaData._observable, false);
    }
  } catch (error) {
    console.log(error);
    yield put(_setGitHubLoadingError(error));
    yield put(_setIsLoadingGitHubIssuesItems(false));
    yield put(_setGitHubIssuesItems([]));
    emitNextAndComplete(sagaData._observable, false);
    throwError(sagaData._observable, handleError((_.isError(error) ? error : new Error), error, sagaName, sagaData.showErrorAlerts, sagaData.onErrorAlertDismissal));
  }
}
// -------------------

/**
 * This is a helper saga to avoid duplicate code in other sagas
 */
function* setGitHubIssuesItemsAndGroups(items: IIssueJSON[]): SagaIterator {
  const gitHubIssuesGroups: IIssueGroup[] = [];
  const groupedItems: {[key: string]: IIssueJSON[]} = _.groupBy(items, (item: IIssueJSON) => {
    return moment.utc(item.created_at).local().format('YYYY-MM-DD');
  });
  _.each(groupedItems, (items: IIssueJSON[], key: string) => {
    gitHubIssuesGroups.push({
      date: key,
      data: items
    } as IIssueGroup);
  });
  yield put(_setGitHubIssuesItems(items));
  yield put(_setGitHubIssuesGroups(gitHubIssuesGroups));
}
// ---------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------

// Root App Saga -------------------------------------------------------------------------------
export function* rootAppSaga() {
  yield takeLeading(AppActionsTypes.INIT_APP_STATE_SAGA, initAppStateSaga);
  yield takeLatest(AppActionsTypes.LOAD_GITHUB_REPOSITORY_ISSUES_LIST_SAGA , githubRepositoryIssuesListSaga);

}
// ---------------------------------------------------------------------------------------------

// Error Handling ------------------------------------------------------------------------------
function handleError(stackTraceCapturer: Error, error: any, location: string, showErrorAlert?: boolean, onErrorAlertDismissal?: () => void): ISagaThrownError {
  const errorToReport: IFetchIssueGlobalError = {} as IFetchIssueGlobalError;
  return SagaErrorHandler.handleError(errorToReport, location, 'appSaga', showErrorAlert, onErrorAlertDismissal);
}
// ---------------------------------------------------------------------------------------------
