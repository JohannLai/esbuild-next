"use client";

import React, { useState, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import * as ReactDOM from "react-dom/client";

// Extend Window interface to include React and ReactDOM
declare global {
  interface Window {
    React: typeof React;
    ReactDOM: typeof ReactDOM;
  }
}

// Add a loading state to handle esbuild initialization
const defaultCode = `import React from 'react';

function App() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex flex-col items-center">
      <h2 className="text-xl font-bold text-gray-800 mb-2">React Component Example</h2>
      <p className="text-gray-600 mb-4">Count: {count}</p>
      <button 
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default App;`;

export default function Home() {
  const [code, setCode] = useState(defaultCode);
  const [error, setError] = useState<string | null>(null);
  const [compiledCode, setCompiledCode] = useState<string>("");
  const [isEsbuildReady, setIsEsbuildReady] = useState(false);
  const [esbuildInstance, setEsbuildInstance] = useState<
    typeof import("esbuild-wasm") | null
  >(null);
  const previewContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeEsbuild = async () => {
      if (typeof window === "undefined") return;

      try {
        if (!isEsbuildReady) {
          const esbuildModule = await import("esbuild-wasm");
          await esbuildModule.initialize({
            wasmURL: "/esbuild.wasm",
            worker: false,
          });
          if (isMounted) {
            setEsbuildInstance(esbuildModule);
            setIsEsbuildReady(true);
          }
        }
      } catch (err) {
        console.error("Failed to initialize esbuild:", err);
        if (isMounted) {
          setError("Failed to initialize esbuild. Please refresh the page.");
        }
      }
    };

    initializeEsbuild();

    return () => {
      isMounted = false;
    };
  }, [isEsbuildReady]);

  useEffect(() => {
    if (
      !isEsbuildReady ||
      !code ||
      !esbuildInstance ||
      !previewContainerRef.current
    )
      return;

    let root: ReactDOM.Root | null = null;
    let scriptEl: HTMLScriptElement | null = null;
    let timeoutId: NodeJS.Timeout;
    let debounceTimeoutId: NodeJS.Timeout;

    const compileAndRender = async () => {
      try {
        setError(null);

        // Make sure React is available globally
        window.React = React;
        window.ReactDOM = ReactDOM;

        // Create a virtual file system for esbuild
        const result = await esbuildInstance.build({
          entryPoints: ["/virtual/app.jsx"],
          bundle: true,
          write: false,
          format: "iife",
          globalName: "AppBundle",
          target: "es2015",
          jsxFactory: "React.createElement",
          jsxFragment: "React.Fragment",
          plugins: [
            {
              name: "virtual-files",
              setup(build) {
                // Provide the entry point content
                build.onResolve({ filter: /^\/virtual\/app\.jsx$/ }, (args) => {
                  return { path: args.path, namespace: "file" };
                });

                build.onLoad(
                  { filter: /^\/virtual\/app\.jsx$/, namespace: "file" },
                  () => {
                    return { contents: code, loader: "jsx" };
                  }
                );
              },
            },
            // React resolution plugin
            {
              name: "react-resolve",
              setup(build) {
                // Intercept import statements for React
                build.onResolve({ filter: /^react$/ }, () => {
                  return { path: "react", namespace: "react-ns" };
                });

                build.onResolve({ filter: /^react-dom\/client$/ }, () => {
                  return { path: "react-dom/client", namespace: "react-ns" };
                });

                // Provide content for intercepted imports
                build.onLoad(
                  { filter: /.*/, namespace: "react-ns" },
                  (args) => {
                    if (args.path === "react") {
                      return {
                        contents: `
                        export default window.React;
                        export const useState = window.React.useState;
                        export const useEffect = window.React.useEffect;
                        export const useContext = window.React.useContext;
                        export const useReducer = window.React.useReducer;
                        export const useCallback = window.React.useCallback;
                        export const useMemo = window.React.useMemo;
                        export const useRef = window.React.useRef;
                        export const createElement = window.React.createElement;
                        export const Fragment = window.React.Fragment;
                      `,
                        loader: "js",
                      };
                    }

                    if (args.path === "react-dom/client") {
                      return {
                        contents: `
                        export const createRoot = window.ReactDOM.createRoot;
                      `,
                        loader: "js",
                      };
                    }
                  }
                );
              },
            },
          ],
        });

        // Get the bundled code
        const bundledCode = result.outputFiles[0].text;
        setCompiledCode(bundledCode);

        // Clean up previous render safely
        if (root) {
          try {
            root.unmount();
            root = null;
          } catch (e) {
            console.error("Error unmounting previous root:", e);
          }
        }

        if (scriptEl && document.body.contains(scriptEl)) {
          document.body.removeChild(scriptEl);
          scriptEl = null;
        }

        // Set AppBundle to null instead of trying to delete it
        if ("AppBundle" in window) {
          window.AppBundle = null as any;
        }

        // Create a script element to execute the code
        scriptEl = document.createElement("script");
        scriptEl.textContent = bundledCode;
        document.body.appendChild(scriptEl);

        // Now AppBundle should be available as a global variable
        if (typeof window.AppBundle !== "object" || !window.AppBundle.default) {
          throw new Error("No default export found in the React component");
        }

        const App = window.AppBundle.default;

        // Ensure container is still available
        const container = previewContainerRef.current;
        if (!container) {
          throw new Error("Preview container not found");
        }

        // Clear the container before rendering to ensure Tailwind classes are reapplied
        container.innerHTML = "";

        // Render the component
        root = ReactDOM.createRoot(container);
        root.render(React.createElement(App));

        // Force Tailwind to process the new classes
        if (window.dispatchEvent) {
          window.dispatchEvent(new Event("resize"));
        }
      } catch (err) {
        console.error("Compilation error:", err);
        setError(err instanceof Error ? err.message : "Compilation failed");
      }
    };

    // Reduce debounce time for more responsive updates
    const debouncedCompile = () => {
      clearTimeout(debounceTimeoutId);
      debounceTimeoutId = setTimeout(() => {
        compileAndRender().catch(console.error);
      }, 500); // Reduced from 1000ms to 500ms for faster feedback
    };

    // Initial compilation
    timeoutId = setTimeout(debouncedCompile, 100);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(debounceTimeoutId);

      // Safe cleanup with a small delay to avoid React rendering conflicts
      setTimeout(() => {
        if (root) {
          try {
            root.unmount();
          } catch (e) {
            console.error("Error unmounting root during cleanup:", e);
          }
        }

        if (scriptEl && document.body.contains(scriptEl)) {
          document.body.removeChild(scriptEl);
        }

        // Set AppBundle to null instead of trying to delete it
        if ("AppBundle" in window) {
          window.AppBundle = null as any;
        }
      }, 0);
    };
  }, [code, isEsbuildReady, esbuildInstance]);

  return (
    <div className="h-screen w-full p-4">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>
          <div className="h-full">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50}>
          <div className="h-full flex flex-col">
            <div className="flex-1 p-4 bg-white dark:bg-gray-800 overflow-auto">
              {!isEsbuildReady ? (
                <div className="text-gray-500">Initializing esbuild...</div>
              ) : error ? (
                <div className="text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded">
                  {error}
                </div>
              ) : (
                <div ref={previewContainerRef} className="h-full" />
              )}
            </div>
            {compiledCode && (
              <div className="h-1/2 p-4 bg-gray-100 dark:bg-gray-900 overflow-auto">
                <pre className="text-sm">
                  <code>{compiledCode}</code>
                </pre>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
