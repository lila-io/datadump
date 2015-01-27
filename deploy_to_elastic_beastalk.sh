#!/bin/bash

# boto is missing dependency when using AWS tools to push to eb
# http://stackoverflow.com/questions/23365374/aws-aws-push-importerror-no-module-named-boto-in-ubuntu
sudo pip install boto

rm -rf eb_deployment
mkdir -p eb_deployment
cd eb_deployment

git init
git config --global user.email "ivar.prudnikov@gmail.com"
git config --global user.name "Ivar Prudnikov"

# Copy over prod files
rsync -av \
      --exclude='eb_deployment' \
      --exclude='test' \
      --exclude='node_modules' \
      --exclude='.git' \
      --exclude='.idea' \
      --exclude='.gitignore' \
      .. .

# Change devDependencies to smth else so that aws does not install those
sed -i 's/devDependencies/customDependencies/' package.json

# Track and commit the working copy to the local repo
git add -A .
git commit -m "....."

# download AWS tools
curl -#O  "https://s3.amazonaws.com/elasticbeanstalk/cli/AWS-ElasticBeanstalk-CLI-2.6.2.zip"
unzip "AWS-ElasticBeanstalk-CLI-2.6.2.zip"

# run "eb init"
AWS-ElasticBeanstalk-CLI-2.6.2/AWSDevTools/Linux/AWSDevTools-RepositorySetup.sh

# change AWS to support relative files in config
## find all files responsible for config parsing
## http://sebgoo.blogspot.ie/2013/09/elastic-beanstalk-deploy-from-different.html
## also note that sed required new line after "a\" command that is why I use -e $''
find . -type f -name "configfile_parser.py" -print0 | \
xargs -0 sed -i '' -e $'/read(self, pathfilename):/a\\\n'"pathfilename = os.path.realpath(os.path.expanduser(pathfilename))"

# overwrite generated .elasticbeanstalk folder
rsync -av ../.elasticbeanstalk .

# push to configured env (details in .elasticbeanstalk)
git aws.push

# Remove used files
cd ..
rm -rf eb_deployment

echo "****************************************************"
echo "******************* Deployed ***********************"
echo "****************************************************"
