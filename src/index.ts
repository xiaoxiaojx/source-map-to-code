import fs from 'fs';
import os from 'os';
import sourceMap, {
  Position,
  NullableMappedPosition,
  BasicSourceMapConsumer,
  IndexedSourceMapConsumer,
} from 'source-map';

interface INullableMappedPosition {
  source: string;
  line: number;
  column: number;
  name: string;
}

interface IGetSourceCodeInfoOptions {
  filePath: string;
  position: Position;
}

interface ISource {
  source: string;
  line: number;
}

interface IGetSourcesResult {
  sources: ISource[];
  position: Position;
  filePath: string;
}

type ILogger = (message?: string) => void;

async function getSourceCodeInfo(
  options: IGetSourceCodeInfoOptions
): Promise<IGetSourcesResult | null> {
  const { filePath, position } = options;
  const sourceMapPath: string = findSourceMapPath(filePath);

  if (!sourceMapPath) {
    return null;
  }

  try {
    const consumer:
      | BasicSourceMapConsumer
      | IndexedSourceMapConsumer = await new sourceMap.SourceMapConsumer(
      fs.readFileSync(sourceMapPath, 'utf-8')
    );
    const originalPosition: NullableMappedPosition = consumer.originalPositionFor(
      position
    );

    if (!checkOriginalPosition(originalPosition)) {
      consumer.destroy();
      return null;
    }

    const source: string = consumer.sourceContentFor(
      originalPosition.source
    ) as string;
    if (!source) {
      consumer.destroy();
      return null;
    }

    // consumer.destroy();
    return {
      sources: getSources({ ...originalPosition, source }),
      position: {
        line: originalPosition.line,
        column: originalPosition.column,
      },
      filePath: originalPosition.source,
    };
  } catch (err) {}
  return null;
}

async function printSourceCodeInfo(
  options: IGetSourceCodeInfoOptions,
  logger: ILogger = console.log
) {
  const info = await getSourceCodeInfo(options);
  if (info !== null) {
    const { sources, position, filePath } = info;
    logger();
    logger("Source code file path:");
    logger(`  ${filePath}`)
    logger();
    logger("Source code snippets:");
    sources.forEach((source) => {
      let message: string = `  ${source.line}  ${source.source}`;
      if (position.line === source.line) {
        message += `   <------ Error(${position.line}:${position.column})`;
      }
      logger(message);
    });
    logger();
  }
}

function checkOriginalPosition(
  options: NullableMappedPosition
): options is INullableMappedPosition {
  const { source, column, line } = options;

  if (!source) {
    return false;
  }

  if (typeof column !== 'number') {
    return false;
  }

  if (typeof line !== 'number') {
    return false;
  }

  return true;
}

function getSources(options: INullableMappedPosition): ISource[] {
  const { source, line } = options;
  const linefeed: string = os.EOL;
  if (!source.includes(linefeed)) {
    return [
      {
        source,
        line: 1,
      },
    ];
  } else {
    return source
      .split(linefeed)
      .map((content, index) => ({
        source: content,
        line: index + 1,
      }))
      .slice(...getRange(line));
  }
}

function findSourceMapPath(filePath: string): string {
  if (fs.existsSync(filePath + '.map')) {
    return filePath + '.map';
  }
  return '';
}

function getRange(line: number): [number, number] {
  if (line < 3) {
    return [0, line];
  }
  return [line - 2, line + 1];
}

module.exports = {
  getSourceCodeInfo,
  printSourceCodeInfo,
};
