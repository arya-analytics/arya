#!/bin/bash

if [[ -z "$1" ]]; then
    echo "Usage: $0 <version>"
    exit 1
fi

VERSION=$1

# Function to update the version in the VERSION file
update_version_file() {
    local version_file="../synnax/pkg/version/VERSION"
    echo "$VERSION" > "$version_file"
    echo "Updated VERSION file to $VERSION"
}

# Combined function to update the version in either a TypeScript package.json or Python pyproject.toml file
update_version() {
    local path=$1
    local version=$2

    if [[ -f "$path/package.json" ]]; then
        sed -i '' "s/\"version\": \".*\"/\"version\": \"$version\"/" "$path/package.json"
        echo "Updated version in $path/package.json"
    elif [[ -f "$path/pyproject.toml" ]]; then
        sed -i '' "s/^version = \".*\"/version = \"$version\"/" "$path/pyproject.toml"
        echo "Updated version in $path/pyproject.toml"
    else
        echo "No package.json or pyproject.toml found in $path!"
    fi
}

update_version_file

paths=("../x/ts" "../alamos/ts" "../client/ts" "../pluto" "../console" "../drift" ".." "../freighter/ts" "../freighter/py" "../alamos/py" "../client/py")

for path in "${paths[@]}"; do
    update_version "$path" "$VERSION"
done

echo "Version update complete."

./check_version.sh

CHECK_VERSION_STATUS=$?

if [[ $CHECK_VERSION_STATUS -eq 0 ]]; then
    echo "All version checks passed successfully."
else
    echo "Some version checks failed. Please review the output above."
fi

exit $CHECK_VERSION_STATUS