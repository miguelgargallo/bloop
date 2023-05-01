import React, { useCallback, useContext, useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import ErrorFallback from '../../components/ErrorFallback';
import LiteLoader from '../../components/Loaders/LiteLoader';
import Button from '../../components/Button';
import { CloseSign } from '../../icons';
import { getRepos } from '../../services/api';
import { RepositoriesContext } from '../../context/repositoriesContext';
import { RepoType, SyncStatus } from '../../types/general';
import AddRepos from './AddRepos';
import ReposSection from './ReposSection';
import AddRepoCard from './AddRepoCard';

const filterRepositories = (repos?: RepoType[]) => {
  return (
    repos?.filter(
      (r) =>
        r.sync_status !== SyncStatus.Uninitialized &&
        r.sync_status !== SyncStatus.Removed,
    ) || []
  );
};

const HomePage = () => {
  const { setRepositories, repositories } = useContext(RepositoriesContext);
  const [popupOpen, setPopupOpen] = useState(false);
  const [isAddReposOpen, setAddReposOpen] = useState<
    null | 'local' | 'github' | 'public'
  >(null);
  const [reposToShow, setReposToShow] = useState<RepoType[]>(
    filterRepositories(repositories),
  );

  const fetchRepos = useCallback(() => {
    getRepos().then((data) => {
      const list = data?.list?.sort((a, b) => (a.name < b.name ? -1 : 1)) || [];
      setRepositories(list);
      setReposToShow(filterRepositories(list));
    });
  }, []);

  useEffect(() => {
    fetchRepos();
    const intervalId = setInterval(fetchRepos, 10000);
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  return (
    <div className="w-full flex flex-col mx-auto max-w-6.5xl">
      <div className="p-8 pb-0">
        <h4 className="mb-3">Add</h4>
        <div className="flex gap-3.5">
          <AddRepoCard type="github" onClick={setAddReposOpen} />
          <AddRepoCard type="public" onClick={setAddReposOpen} />
          <AddRepoCard type="local" onClick={setAddReposOpen} />
        </div>
      </div>
      <ReposSection reposToShow={reposToShow} setReposToShow={setReposToShow} />
      <AddRepos
        addRepos={isAddReposOpen}
        onClose={(isSubmitted) => {
          if (isSubmitted) {
            fetchRepos();
            setPopupOpen(true);
            setTimeout(() => setPopupOpen(false), 3000);
          }
          setAddReposOpen(null);
        }}
      />
      {popupOpen && (
        <div
          className={`fixed w-85 p-3 flex gap-3 bg-gray-800 border border-gray-700 shadow-dark left-8 bottom-24 z-40 text-primary-300`}
        >
          <LiteLoader />
          <div className="flex flex-col gap-1">
            <p className="body-s text-white">Syncing repository</p>
            <p className="caption text-gray-400">
              We are syncing your repository to bloop. This might take a couple
              on minutes
            </p>
          </div>
          <Button
            variant="tertiary"
            size="tiny"
            onlyIcon
            title="Close"
            onClick={() => setPopupOpen(false)}
          >
            <CloseSign />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Sentry.withErrorBoundary(HomePage, {
  fallback: (props) => <ErrorFallback {...props} />,
});
